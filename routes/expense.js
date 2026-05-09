const express = require('express');
const expenseController = require('../controllers/expenseController');

const router = express.Router();

// Middleware to check if user is logged in
const isLoggedIn = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
};

router.get('/dashboard', isLoggedIn, expenseController.getDashboard);
router.post('/group/create', isLoggedIn, expenseController.createGroup);
router.get('/group/:groupId', isLoggedIn, expenseController.getGroupDetails);
router.post('/add', isLoggedIn, expenseController.addExpense);
router.delete('/group/:groupId', isLoggedIn, expenseController.deleteGroup);
router.delete('/:expenseId', isLoggedIn, expenseController.deleteExpense);

module.exports = router;
