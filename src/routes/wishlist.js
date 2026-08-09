const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

const listingCard = {
  id: true, year: true, make: true, variant: true, color: true, fuelType: true,
  kmRun: true, owners: true, price: true, status: true, createdAt: true,
  photos: { select: { id: true, url: true } },
  seller: { select: { id: true, name: true, role: true, city: true } },
};

// GET /api/wishlist — my saved cars
router.get("/", requireAuth, async (req, res) => {
  const items = await prisma.wishlist.findMany({
    where: { userId: req.user.id },
    include: { car: { select: listingCard } },
    orderBy: { addedAt: "desc" },
  });
  res.json({ items });
});

// POST /api/wishlist/:carId — add a car to my wishlist
router.post("/:carId", requireAuth, async (req, res) => {
  try {
    const item = await prisma.wishlist.create({
      data: { userId: req.user.id, carId: req.params.carId },
    });
    res.status(201).json({ item });
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ error: "Already in your wishlist." });
    res.status(500).json({ error: "Could not add to wishlist." });
  }
});

// DELETE /api/wishlist/:carId — remove from wishlist
router.delete("/:carId", requireAuth, async (req, res) => {
  await prisma.wishlist.deleteMany({ where: { userId: req.user.id, carId: req.params.carId } });
  res.json({ message: "Removed from wishlist." });
});

module.exports = router;
