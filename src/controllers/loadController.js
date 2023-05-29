const { Load, loadJoiSchema } = require('../models/Load');
const { Truck } = require('../models/Truck');
const { User } = require('../models/User');
const { saveLoad } = require('../services/loadService');
const { getTruckForLoad } = require('../services/loadService');

const getLoads = async (req, res, next) => {
  if (req.user.role === 'DRIVER') {
    const loadsDriver = await Load.find({ assigned_to: req.user.userId, status: 'ASSIGNED' });
    return res.status(200).json({
      loadsDriver,
    });
  }
  const loadsShipper = await Load.find({ created_by: req.user.userId, status: { $ne: 'ARCHIVE' } }, '-__v');
  res.status(200).json({
    loads: loadsShipper,
  });
};

async function createLoads(req, res, next) {
  try {
    const {
      name, payload, pickup_address, delivery_address, dimensions,
    } = req.body;
    await loadJoiSchema.validateAsync({
      name, payload, pickup_address, delivery_address, dimensions,
    });
    const loadNew = await saveLoad({
      name, payload, pickup_address, delivery_address, dimensions,
    });
    loadNew.created_by = req.user.userId;
    await loadNew.save();
    res.status(200).json(
      {
        loadNew,
      },
    );
  } catch (error) {
    res.status(500).json({
      message: 'My Server error',
    });
  }
}

const getLoadActive = async (req, res, next) => {
  try {
    if (req.user.role === 'DRIVER') {
      const activeLoad = await Load.findOne(
        {
          assigned_to: req.user.userId,
          $and: [
            { status: { $nin: ['ARCHIVE', 'SHIPPED'] } },
            { status: { $exists: true } },
          ],
        },
      );
      res.status(200).json({ load: activeLoad });
    } else {
      res.status(400).json({ message: 'Access is denied' });
    }
  } catch (err) {
    res.status(500).json({
      message: 'My Server error',
    });
  }
};

const updateLoadActive = async (req, res, next) => {
  try {
    if (req.user.role === 'DRIVER') {
      const states = ['En route to Pick Up', 'En route to delivery', 'Arrived to delivery'];
      const activeLoad = await Load.findOne({ assigned_to: req.user.userId, status: 'ASSIGNED' });
      if (await activeLoad.state === states[0]) {
        await Load.findOneAndUpdate(
          { assigned_to: req.user.userId, status: 'ASSIGNED' },
          { $set: { state: states[1] } },
        );
        const activeLoadNew = await Load.findOne({ assigned_to: req.user.userId, status: 'ASSIGNED' });
        return res.status(200).json(
          {
            activeLoadNew,
            message: `Load state changed to ${states[1]}`,
          },
        );
      }
      if (await activeLoad.state === states[1]) {
        await Load.findOneAndUpdate(
          { assigned_to: req.user.userId, status: 'ASSIGNED' },
          {
            $set: {
              state: states[2],
              status: 'SHIPPED',
            },
          },
        );
      }
      const activeLoadNew = await Load.findOne({ assigned_to: req.user.userId, status: 'SHIPPED', state: states[2] });
      const truck = await Truck.findOneAndUpdate(
        { assigned_to: req.user.userId, status: 'OL' },
        { $set: { status: 'IS', assigned_to: null } },
      );

      return res.status(200).json(
        {
          activeLoadNew,
          message: `Load state changed to ${states[2]}. Load successfully delivered. Now you have no active loads`,
        },
      );
    }
  } catch (err) {
    res.status(500).json({
      message: `My Server error =${err.message}`,
    });
  }
};

async function createLoadsById(req, res, next) {
  const loadId = req.params.id;
  const load = await Load.findById(loadId);
  const truckForLoad = getTruckForLoad(
    load.dimensions.width,
    load.dimensions.length,
    load.dimensions.height,
    load.payload,
  );
  const activeTruck = await Truck.findOne(
    {
      status: 'IS',
      assigned_to: { $ne: null },
    },
  );
  console.log(activeTruck);
  // console.log(activeTruck.assigned_to);
  let driverActiveTruck;
  if (activeTruck !== null) {
    driverActiveTruck = await User.findOne(
      {
        _id: await activeTruck.assigned_to,
      },
    );
  }

  const currentLoad = await Load.findOne({ _id: loadId });
  if (!activeTruck && (currentLoad.status === 'NEW')) {
    await Load.findByIdAndUpdate({ _id: loadId }, {
      $set: {
        status: 'NEW',
        logs:
                    {
                      message: 'Driver was not found',
                      time: new Date().toLocaleDateString(),
                    },
      },
    });

    const updateLoad = await Load.findOne({ _id: loadId });
    return res.status(400).json({
      updateLoad,
    });
  }

  if (!activeTruck && currentLoad.status === 'ASSIGNED') {
    await Load.findByIdAndUpdate({ _id: loadId }, {
      $set: {
        logs:
                    {
                      message: 'The load has already been assigned to the driver',
                      time: new Date().toLocaleDateString(),
                    },
      },
    });

    const updateLoad = await Load.findOne({ _id: loadId });
    return res.status(400).json({
      updateLoad,
    });
  }

  if (!activeTruck && currentLoad.status === 'SHIPPED') {
    await Load.findByIdAndUpdate({ _id: loadId }, {
      $set: {
        logs:
                    {
                      message: 'The load has been delivered. You need to pick up the load.',
                      time: new Date().toLocaleDateString(),
                    },
      },
    });

    const updateLoad = await Load.findOne({ _id: loadId });
    return res.status(400).json({
      updateLoad,
    });
  }
  if (truckForLoad === undefined) {
    await Load.findByIdAndUpdate({ _id: loadId }, {
      $set: {
        status: 'NEW',
        logs:
                    {
                      message: `Driver was not found. Load parameters too large. 
                      It is impossible to find a truck for cargo with such data.`,
                      time: new Date().toLocaleDateString(),
                    },
      },
    });
    const updateLoad = await Load.findOne({ _id: loadId });
    res.status(400).json({
      updateLoad,
    });
  } else if (truckForLoad.length <= 1 && await activeTruck.type === truckForLoad[0]) {
    await dataUpdate(await activeTruck.assigned_to, await driverActiveTruck.email);
  } else if (truckForLoad.length <= 2 && (
    await activeTruck.type === truckForLoad[0]
     || await activeTruck.type === truckForLoad[1])) {
    await dataUpdate(await activeTruck.assigned_to, await driverActiveTruck.email);
  } else if (truckForLoad.length <= 3 && (await activeTruck.type === truckForLoad[0]
                || await activeTruck.type === truckForLoad[1]
                || await activeTruck.type === truckForLoad[2])) {
    await dataUpdate(await activeTruck.assigned_to, await driverActiveTruck.email);
  } else {
    await Load.findByIdAndUpdate({ _id: loadId }, {
      $set: {
        status: 'NEW',
        logs:
                    {
                      message: 'Driver was not found',
                      time: new Date().toLocaleDateString(),
                    },
      },
    });
    const updateLoad = await Load.findOne({ _id: loadId });
    res.status(400).json({
      updateLoad,
    });
  }

  async function dataUpdate(idDriver, emailDriver) {
    await activeTruck.updateOne({
      $set: { status: 'OL' },
    });
    await Load.findByIdAndUpdate({ _id: loadId }, {
      $set: {
        status: 'ASSIGNED',
        state: 'En route to Pick Up',
        assigned_to: idDriver,
        logs:
                    {
                      message: `Load assigned to driver with id ${idDriver} and email ${emailDriver}`,
                      time: new Date().toLocaleDateString(),
                    },
      },
    });

    const updateLoad = await Load.findOne({ _id: loadId });
    res.status(200).json({
      updateLoad,
    });
  }
}

const updateIfReadLoadActive = async (req, res, next) => {
  try {
    if (req.user.role === 'DRIVER') {
      await Load.findOneAndUpdate({ assigned_to: req.user.userId, status: 'ASSIGNED' }, {
        $set: { readByDriver: true },
      });
      const activeLoad = await Load.findOne({ assigned_to: req.user.userId, status: 'ASSIGNED', readByDriver: true });
      return res.status(200).json({ activeLoad });
    } if (req.user.role === 'SHIPPER') {
      await Load.updateMany(
        { readByShipper: { $eq: false } },
        { $set: { readByShipper: true } },
      );
      const activeLoadsReadByShipper = await Load.find(
        { created_by: req.user.userId, state: 'Arrived to delivery', readByShipper: true },
      );
      return res.status(200).json({ activeLoad: { load: activeLoadsReadByShipper } });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getLoadById = async (req, res, next) => {
  try {
    const load = await Load.findById(req.params.id);
    res.status(200).json(load);
  } catch (err) {
    res.status(500).json({ message: 'My Server error' });
  }
};

const updateMyLoadById = async (req, res, next) => {
  try {
    const {
      name, payload, pickup_address, delivery_address, dimensions,
    } = req.body;
    const loadCurrent = await Load.findById({ _id: req.params.id, created_by: req.user.userId });
    if (loadCurrent && await loadCurrent.status === 'NEW') {
      const load = await Load.findByIdAndUpdate(
        { _id: req.params.id, created_by: req.user.userId },
        {
          $set: {
            name, payload, pickup_address, delivery_address, dimensions,
          },
        },
      );

      const updateLoad = await Load.findOne({ _id: req.params.id, created_by: req.user.userId });
      res.status(200).json({
        updateLoad,
      });
    } else {
      res.status(400).json({
        message: 'Load details cannot be changed. The load has already been assigned to the driver',
      });
    }
  } catch (err) {
    res.status(500).json({ message: 'My Server error' });
  }
};

const deleteLoadById = async (req, res, next) => {
  try {
    const loadCurrent = await Load.findById({ _id: req.params.id, created_by: req.user.userId });
    if (await loadCurrent.status === 'NEW') {
      const deletedLoad = await Load.findByIdAndDelete(req.params.id);
      res.status(200).json({
        deletedLoad,
      });
    } else if (await loadCurrent.status === 'SHIPPED') {
      res.status(400).json({
        message: 'Load cannot be deleted, You need to pick up the load',
      });
    } else {
      res.status(400).json({
        message: 'Load cannot be deleted, it is already assigned to the driver',
      });
    }
  } catch (err) {
    res.status(500).json({ message: 'My Server error' });
  }
};

const getShippindInfo = async (req, res, next) => {
  try {
    const assignedLoad = await Load.find({
      status: 'ASSIGNED', created_by: req.user.userId,
    });
    const loadArrivedToDelivery = await Load.find({
      state: 'Arrived to delivery', created_by: req.user.userId,
    });
    if (assignedLoad.length === 0 && loadArrivedToDelivery.length === 0) {
      return res.status(200).json({
        assignedLoad: [],
        loadArrivedToDelivery: [],
      });
    }
    if (assignedLoad.length > 0 && loadArrivedToDelivery.length === 0) {
      return res.status(200).json({
        assignedLoad,
        loadArrivedToDelivery: [],
      });
    }
    if (assignedLoad.length > 0 && loadArrivedToDelivery.length > 0) {
      return res.status(200).json({
        assignedLoad,
        loadArrivedToDelivery,
      });
    }
    if (assignedLoad.length === 0 && loadArrivedToDelivery.length > 0) {
      return res.status(200).json({
        assignedLoad: [],
        loadArrivedToDelivery,
      });
    }
  } catch (err) {
    res.status(500).json({ message: 'My Server error' });
  }
};

const archiveLoad = async (req, res, next) => {
  try {
    const loadCurrent = await Load.findById({ _id: req.params.id, created_by: req.user.userId });
    if (loadCurrent && await loadCurrent.status === 'SHIPPED' && loadCurrent.state === 'Arrived to delivery') {
      const load = await Load.findByIdAndUpdate(
        { _id: req.params.id, created_by: req.user.userId },
        {
          $set: {
            status: 'ARCHIVE', state: 'Received',
          },
        },
      );

      const archiveCurrLoad = await Load.findOne({
        _id: req.params.id,
        created_by: req.user.userId,
      });
      res.status(200).json({
        archiveCurrLoad,
        message: 'The load was successfully received and transferred to the archive',
      });
    } else {
      res.status(400).json({
        message: 'Something went wrong. Load cannot be archived',
      });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getArchiveLoadsForShipper = async (req, res, next) => {
  try {
    const loads = await Load.find({
      state: 'Received',
      status: 'ARCHIVE',
    });

    res.status(200).json({
      loads,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getLoads,
  createLoads,
  getLoadActive,
  updateLoadActive,
  getLoadById,
  createLoadsById,
  updateMyLoadById,
  deleteLoadById,
  getShippindInfo,
  updateIfReadLoadActive,
  archiveLoad,
  getArchiveLoadsForShipper,
};
