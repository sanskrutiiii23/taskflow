const Task = require('../models/Task');
const asyncWrapper = require('../middleware/async');
const { createCustomError } = require('../errors/custom-error');

const getStats = async () => {
  const [total, completed, overdue] = await Promise.all([
    Task.countDocuments({}),
    Task.countDocuments({ completed: true }),
    Task.countDocuments({
      completed: false,
      dueDate: { $ne: null, $lt: new Date() },
    }),
  ]);

  return {
    total,
    completed,
    pending: total - completed,
    overdue,
  };
};

const getAllTasks = asyncWrapper(async (req, res) => {
  const { completed, priority, search, sort } = req.query;
  const queryObject = {};

  if (completed === 'true' || completed === 'false') {
    queryObject.completed = completed === 'true';
  }

  if (priority && ['low', 'medium', 'high'].includes(priority)) {
    queryObject.priority = priority;
  }

  if (search) {
    queryObject.name = { $regex: search, $options: 'i' };
  }

  let tasks = await Task.find(queryObject).lean();

  if (sort === 'oldest') {
    tasks.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  } else if (sort === 'priority') {
    const rank = { high: 0, medium: 1, low: 2 };
    tasks.sort((a, b) => {
      const diff = rank[a.priority] - rank[b.priority];
      if (diff !== 0) return diff;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  } else if (sort === 'due') {
    tasks.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
  } else {
    tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  const stats = await getStats();

  res.status(200).json({
    status: 'success',
    tasks,
    count: tasks.length,
    stats,
  });
});

const createTask = asyncWrapper(async (req, res) => {
  const task = await Task.create(req.body);
  res.status(201).json({ task });
});

const getTask = asyncWrapper(async (req, res, next) => {
  const { id: taskID } = req.params;
  const task = await Task.findOne({ _id: taskID });

  if (!task) {
    return next(createCustomError(`No task found with id: ${taskID}`, 404));
  }

  res.status(200).json({ task });
});

const updateTask = asyncWrapper(async (req, res, next) => {
  const { id: taskID } = req.params;
  const task = await Task.findOneAndUpdate({ _id: taskID }, req.body, {
    new: true,
    runValidators: true,
  });

  if (!task) {
    return next(createCustomError(`No task found with id: ${taskID}`, 404));
  }

  res.status(200).json({ task });
});

const deleteTask = asyncWrapper(async (req, res, next) => {
  const { id: taskID } = req.params;
  const task = await Task.findOneAndDelete({ _id: taskID });

  if (!task) {
    return next(createCustomError(`No task found with id: ${taskID}`, 404));
  }

  res.status(200).json({ task, status: 'success' });
});

const clearCompleted = asyncWrapper(async (req, res) => {
  const result = await Task.deleteMany({ completed: true });
  res.status(200).json({
    status: 'success',
    deletedCount: result.deletedCount,
  });
});

module.exports = {
  getAllTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  clearCompleted,
};
