const { Truck } = require('../models/Truck');

async function createTrucks(req, res, next) {
  try {
    const { type } = req.body;
    if (!type) {
      res.status(400).json({ message: 'The field must not be empty' });
    }
    const truck = new Truck({
      created_by: req.user.userId,
      type,
      status: 'IS',
    });
    await truck.save();
    res.status(200).json(
      {
        truck,
      },
    );
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
    });
  }
}

async function getTrucks(req, res, next) {
  const trucks = await Truck.find({ created_by: req.user.userId }, '-__v');
  res.send({
    trucks,
  });
}

const getTruck = async (req, res, next) => {
  try {
    const truck = await Truck.findById(req.params.id);
    if (!truck) {
      res.status(400).json({ message: 'This truck not found' });
    }
    res.status(200).json({
      truck,
    });
  } catch (err) {
    res.status(500).json({
      message: 'My Server error',
    });
  }
};

const updateMyTruckById = async (req, res, next) => {
  try {
    const { type } = req.body;
    await Truck.findByIdAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { $set: { type } },
    );

    const updateTruck = await Truck.findOne({ _id: req.params.id });
    res.status(200).json({
      updateTruck,
    });
  } catch (error) {
    res.status(500).json({
      message: 'My Server error',
    });
  }
};

const deleteTruck = async (req, res, next) => {
  try {
    const truckCurrent = await Truck.findById({ _id: req.params.id, created_by: req.user.userId });
    if (await truckCurrent.assigned_to === null) {
      const truck = await Truck.findByIdAndDelete(req.params.id);
      res.status(200).json({
        truck,
      });
    } else {
      res.status(400).json({
        message: 'Truck cannot be deleted, it is already assigned to the driver',
      });
    }
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
    });
  }
};

const assignTruckById = async (req, res, next) => {
  try {
    const truckId = req.params.id;
    const currentTruck = await Truck.findOne({ _id: truckId });
    const assignTrucks = await Truck.find({ assigned_to: req.user.userId });
    if (currentTruck.status === 'OL') {
      res.status(400).json({ message: 'You have already an active load' });
    } else if (assignTrucks.length === 1) {
      res.status(400).json({ message: 'You have already assigned a truck' });
    } else {
      const truckAssign = await Truck.findByIdAndUpdate(
        { _id: truckId },
        { $set: { assigned_to: req.user.userId } },
      );
      await truckAssign.save();
      const truck = await Truck.findOne({ _id: truckId });
      res.status(200).json({
        truck,
        message: 'Truck assigned successfully',
      });
    }
  } catch (err) {
    res.status(500).json({ message: 'My Server error' });
  }
};

module.exports = {
  createTrucks,
  getTrucks,
  getTruck,
  updateMyTruckById,
  deleteTruck,
  assignTruckById,
};
