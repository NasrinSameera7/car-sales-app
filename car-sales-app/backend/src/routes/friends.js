const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

const publicFields = { id: true, name: true, role: true, city: true };

// GET /api/friends/search?q=name — find other users to add as friends
router.get("/search", requireAuth, async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.json({ users: [] });
  const users = await prisma.user.findMany({
    where: { name: { contains: q, mode: "insensitive" }, id: { not: req.user.id } },
    select: publicFields,
    take: 20,
  });
  res.json({ users });
});

// GET /api/friends — my accepted friends + pending requests (sent and received)
router.get("/", requireAuth, async (req, res) => {
  const [sent, received] = await Promise.all([
    prisma.friendship.findMany({
      where: { requesterId: req.user.id },
      include: { addressee: { select: publicFields } },
    }),
    prisma.friendship.findMany({
      where: { addresseeId: req.user.id },
      include: { requester: { select: publicFields } },
    }),
  ]);

  const friends = [
    ...sent.filter((f) => f.status === "ACCEPTED").map((f) => f.addressee),
    ...received.filter((f) => f.status === "ACCEPTED").map((f) => f.requester),
  ];
  const incomingRequests = received.filter((f) => f.status === "PENDING").map((f) => ({ id: f.id, user: f.requester }));
  const outgoingRequests = sent.filter((f) => f.status === "PENDING").map((f) => ({ id: f.id, user: f.addressee }));

  res.json({ friends, incomingRequests, outgoingRequests });
});

// POST /api/friends/request/:userId — send a friend request
router.post("/request/:userId", requireAuth, async (req, res) => {
  if (req.params.userId === req.user.id) {
    return res.status(400).json({ error: "You can't add yourself as a friend." });
  }
  try {
    const friendship = await prisma.friendship.create({
      data: { requesterId: req.user.id, addresseeId: req.params.userId },
    });
    res.status(201).json({ friendship });
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ error: "Friend request already sent." });
    res.status(500).json({ error: "Could not send friend request." });
  }
});

// POST /api/friends/accept/:requestId — accept an incoming request
router.post("/accept/:requestId", requireAuth, async (req, res) => {
  const request = await prisma.friendship.findUnique({ where: { id: req.params.requestId } });
  if (!request || request.addresseeId !== req.user.id) {
    return res.status(404).json({ error: "Friend request not found." });
  }
  const updated = await prisma.friendship.update({
    where: { id: request.id },
    data: { status: "ACCEPTED" },
  });
  res.json({ friendship: updated });
});

// DELETE /api/friends/:requestId — decline a request or remove a friend
router.delete("/:requestId", requireAuth, async (req, res) => {
  const request = await prisma.friendship.findUnique({ where: { id: req.params.requestId } });
  if (!request || ![request.requesterId, request.addresseeId].includes(req.user.id)) {
    return res.status(404).json({ error: "Not found." });
  }
  await prisma.friendship.delete({ where: { id: request.id } });
  res.json({ message: "Removed." });
});

module.exports = router;
