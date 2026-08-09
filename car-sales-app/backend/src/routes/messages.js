const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

function otherParticipant(conversation, myId) {
  return conversation.participantAId === myId ? conversation.participantB : conversation.participantA;
}

// GET /api/messages — inbox: all my conversations, most recently active first
router.get("/", requireAuth, async (req, res) => {
  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ participantAId: req.user.id }, { participantBId: req.user.id }] },
    include: {
      participantA: { select: { id: true, name: true } },
      participantB: { select: { id: true, name: true } },
      car: { select: { id: true, variant: true, year: true, photos: { take: 1 } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const withOther = conversations
    .map((c) => ({
      id: c.id,
      car: c.car,
      otherUser: otherParticipant(c, req.user.id),
      lastMessage: c.messages[0] || null,
    }))
    .sort((a, b) => {
      const at = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const bt = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return bt - at;
    });

  res.json({ conversations: withOther });
});

// POST /api/messages/start — start (or reuse) a conversation about a car with the seller,
// and optionally send the first message right away.
router.post("/start", requireAuth, async (req, res) => {
  const { carId, text } = req.body;
  if (!carId) return res.status(400).json({ error: "carId is required." });

  const car = await prisma.carListing.findUnique({ where: { id: carId } });
  if (!car) return res.status(404).json({ error: "This listing no longer exists." });
  if (car.sellerId === req.user.id) {
    return res.status(400).json({ error: "You can't message yourself about your own listing." });
  }

  const [participantAId, participantBId] = [req.user.id, car.sellerId].sort();

  let conversation = await prisma.conversation.findFirst({
    where: { carId, participantAId, participantBId },
  });
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { carId, participantAId, participantBId },
    });
  }

  if (text && text.trim()) {
    await prisma.message.create({
      data: { conversationId: conversation.id, senderId: req.user.id, text: text.trim() },
    });
  }

  res.status(201).json({ conversationId: conversation.id });
});

// GET /api/messages/:conversationId — full thread
router.get("/:conversationId", requireAuth, async (req, res) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: req.params.conversationId },
    include: {
      participantA: { select: { id: true, name: true } },
      participantB: { select: { id: true, name: true } },
      car: { select: { id: true, variant: true, year: true, photos: { take: 1 } } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!conversation) return res.status(404).json({ error: "Conversation not found." });
  if (![conversation.participantAId, conversation.participantBId].includes(req.user.id)) {
    return res.status(403).json({ error: "You don't have access to this conversation." });
  }

  res.json({
    conversation: {
      id: conversation.id,
      car: conversation.car,
      otherUser: otherParticipant(conversation, req.user.id),
      messages: conversation.messages,
    },
  });
});

// POST /api/messages/:conversationId — send a message in an existing thread
router.post("/:conversationId", requireAuth, async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: "Message can't be empty." });

  const conversation = await prisma.conversation.findUnique({ where: { id: req.params.conversationId } });
  if (!conversation) return res.status(404).json({ error: "Conversation not found." });
  if (![conversation.participantAId, conversation.participantBId].includes(req.user.id)) {
    return res.status(403).json({ error: "You don't have access to this conversation." });
  }

  const message = await prisma.message.create({
    data: { conversationId: conversation.id, senderId: req.user.id, text: text.trim() },
  });
  res.status(201).json({ message });
});

module.exports = router;
