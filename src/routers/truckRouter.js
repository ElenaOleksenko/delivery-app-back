const express = require('express');

const router = express.Router();
const {
  getTrucks,
  createTrucks,
  getTruck,
  updateMyTruckById,
  deleteTruck,
  assignTruckById,
} = require('../controllers/truckController');

router.get('/', getTrucks);
router.post('/', createTrucks);
router.get('/:id', getTruck);
router.put('/:id', updateMyTruckById);
router.delete('/:id', deleteTruck);
router.post('/:id/assign', assignTruckById);

module.exports = {
  truckRouter: router,
};
