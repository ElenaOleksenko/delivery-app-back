const express = require('express');

const router = express.Router();
const {
  getLoads, createLoads, getLoadActive, updateLoadActive,
  getLoadById, updateMyLoadById, deleteLoadById, createLoadsById,
  getShippindInfo, updateIfReadLoadActive, archiveLoad, getArchiveLoadsForShipper,
} = require('../controllers/loadController');

router.post('/', createLoads);
router.get('/', getLoads);
router.get('/active', getLoadActive);
router.get('/archive', getArchiveLoadsForShipper);
router.patch('/active', updateIfReadLoadActive);
router.get('/shipping_info', getShippindInfo);
router.patch('/active/state', updateLoadActive);
router.get('/:id', getLoadById);
router.put('/:id', updateMyLoadById);
router.delete('/:id', deleteLoadById);
router.post('/:id/post', createLoadsById);
router.put('/:id/archive', archiveLoad);

module.exports = {
  loadRouter: router,
};
