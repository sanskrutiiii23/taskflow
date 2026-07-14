const express = require('express');
const router = express.Router();

const {
  getAllTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  clearCompleted,
} = require('../controllers/tasks');

router.route('/').get(getAllTasks).post(createTask);
router.route('/clear-completed').delete(clearCompleted);
router.route('/:id').get(getTask).patch(updateTask).delete(deleteTask);

module.exports = router;
