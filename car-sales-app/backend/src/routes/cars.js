const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { requireAuth, optionalAuth } = require("../middleware/auth");
const { upload } = require("../utils/upload");

const router = express.Router();
const prisma = new PrismaClient();

const listingCard = {
  id: true,
  year: true,
  make: true,
  variant: true,
  color: true,
  fuelType: true,
  kmRun: true,
  owners: true,
  price: true,
  status: true,
  createdAt: true,
  insuranceDetails: true,
  description: true,
  photos: { select: { id: true, url: true } },
  seller: { select: { id: true, name: true, role: true, city: true } },
};

// GET /api/cars — home feed, newest first, with optional search + filters
// Query params: q (free text), fuelType, minYear, maxYear, minPrice, maxPrice
router.get("/", optionalAuth, async (req, res) => {
  try {
    const { q, fuelType, minYear, maxYear, minPrice, maxPrice, mine } = req.query;

    const where = { status: "AVAILABLE" };

    if (q && q.trim()) {
      const term = q.trim();
      where.OR = [
        { variant: { contains: term, mode: "insensitive" } },
        { make: { contains: term, mode: "insensitive" } },
        { color: { contains: term, mode: "insensitive" } },
        { description: { contains: term, mode: "insensitive" } },
        { seller: { city: { contains: term, mode: "insensitive" } } },
      ];
    }
    if (fuelType) where.fuelType = fuelType;
    if (minYear) where.year = { ...(where.year || {}), gte: Number(minYear) };
    if (maxYear) where.year = { ...(where.year || {}), lte: Number(maxYear) };
    if (minPrice) where.price = { ...(where.price || {}), gte: Number(minPrice) };
    if (maxPrice) where.price = { ...(where.price || {}), lte: Number(maxPrice) };

    const listings = await prisma.carListing.findMany({
      where,
      select: listingCard,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    res.json({ listings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load listings right now." });
  }
});

// GET /api/cars/:id — single car detail page
router.get("/:id", optionalAuth, async (req, res) => {
  const car = await prisma.carListing.findUnique({
    where: { id: req.params.id },
    select: listingCard,
  });
  if (!car) return res.status(404).json({ error: "This listing no longer exists." });
  res.json({ car });
});

// POST /api/cars — create a new listing (photos uploaded as multipart form data)
router.post("/", requireAuth, upload.array("photos", 10), async (req, res) => {
  try {
    const { year, variant, color, fuelType, insuranceDetails, kmRun, owners, price, make, description } = req.body;

    if (!year || !variant || !color || !fuelType || !insuranceDetails || kmRun === undefined || owners === undefined) {
      return res.status(400).json({
        error: "Year, variant, color, fuel type, insurance details, km run, and number of owners are all required.",
      });
    }

    const car = await prisma.carListing.create({
      data: {
        sellerId: req.user.id,
        year: Number(year),
        make: make || "",
        variant,
        color,
        fuelType,
        insuranceDetails,
        kmRun: Number(kmRun),
        owners: Number(owners),
        price: price ? Number(price) : 0,
        description: description || "",
        photos: {
          create: (req.files || []).map((f) => ({ url: `/uploads/${f.filename}` })),
        },
      },
      select: listingCard,
    });

    res.status(201).json({ car });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not publish your listing. Please try again." });
  }
});

// GET /api/cars/mine/posts — cars I've posted (still available)
router.get("/mine/posts", requireAuth, async (req, res) => {
  const listings = await prisma.carListing.findMany({
    where: { sellerId: req.user.id },
    select: listingCard,
    orderBy: { createdAt: "desc" },
  });
  res.json({ listings });
});

// GET /api/cars/mine/transactions — cars I've sold and cars I've bought
router.get("/mine/transactions", requireAuth, async (req, res) => {
  const [sold, bought] = await Promise.all([
    prisma.purchase.findMany({
      where: { sellerId: req.user.id },
      include: { car: { select: listingCard }, buyer: { select: { id: true, name: true } } },
      orderBy: { soldAt: "desc" },
    }),
    prisma.purchase.findMany({
      where: { buyerId: req.user.id },
      include: { car: { select: listingCard }, seller: { select: { id: true, name: true } } },
      orderBy: { soldAt: "desc" },
    }),
  ]);
  res.json({ sold, bought });
});

// POST /api/cars/:id/mark-sold — seller marks their car as sold to a buyer
router.post("/:id/mark-sold", requireAuth, async (req, res) => {
  const { buyerId } = req.body;
  const car = await prisma.carListing.findUnique({ where: { id: req.params.id } });
  if (!car) return res.status(404).json({ error: "This listing no longer exists." });
  if (car.sellerId !== req.user.id) {
    return res.status(403).json({ error: "Only the seller can mark this car as sold." });
  }
  if (!buyerId) return res.status(400).json({ error: "Select which buyer purchased the car." });

  const [, purchase] = await prisma.$transaction([
    prisma.carListing.update({ where: { id: car.id }, data: { status: "SOLD" } }),
    prisma.purchase.create({
      data: { carId: car.id, buyerId, sellerId: req.user.id },
    }),
  ]);

  res.json({ purchase });
});

// DELETE /api/cars/:id — remove my own listing
router.delete("/:id", requireAuth, async (req, res) => {
  const car = await prisma.carListing.findUnique({ where: { id: req.params.id } });
  if (!car) return res.status(404).json({ error: "This listing no longer exists." });
  if (car.sellerId !== req.user.id) {
    return res.status(403).json({ error: "You can only remove your own listings." });
  }
  await prisma.carListing.delete({ where: { id: car.id } });
  res.json({ message: "Listing removed." });
});

module.exports = router;
