const { ExpenseGroup, Expense } = require('../models/Expense');
const User = require('../models/User');

// Get all groups for user
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.session.userId;
    const groups = await ExpenseGroup.find({
      $or: [
        { createdBy: userId },
        { 'members.id': userId }
      ]
    }).populate('createdBy');

    res.render('dashboard', {
      groups: groups,
      user: req.session.userId
    });
  } catch (error) {
    console.log(error);
    res.status(500).render('dashboard', {
      message: 'เกิดข้อผิดพลาด'
    });
  }
};

// Create new group
exports.createGroup = async (req, res) => {
  try {
    const { groupName, groupDescription, members } = req.body;
    const userId = req.session.userId;

    if (!groupName || !members) {
      return res.status(400).json({ message: 'กรุณากรอกชื่อกลุ่มและสมาชิก' });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(401).json({ message: 'ผู้ใช้ไม่พบ กรุณาเข้าสู่ระบบใหม่' });
    }

    let membersList = [
      { user: userId, name: user.name }
    ];

    if (Array.isArray(members)) {
      membersList = membersList.concat(members.map(m => ({
        name: m
      })));
    } else if (members && members.length > 0) {
      membersList.push({ name: members });
    }

    const group = new ExpenseGroup({
      name: groupName,
      description: groupDescription,
      createdBy: userId,
      members: membersList
    });

    await group.save();
    res.status(201).json({ message: 'สร้างกลุ่มสำเร็จ', groupId: group._id });
  } catch (error) {
    console.log('Create Group Error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด: ' + error.message });
  }
};

// Get group details
exports.getGroupDetails = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await ExpenseGroup.findById(groupId);
    const expenses = await Expense.find({ group: groupId });

    // Calculate settlements
    const settlements = calculateSettlements(expenses, group.members);

    res.render('groupDetails', {
      group: group,
      expenses: expenses,
      settlements: settlements,
      user: req.session.userId
    });
  } catch (error) {
    console.log(error);
    res.status(500).render('groupDetails', {
      message: 'เกิดข้อผิดพลาด'
    });
  }
};

// Add expense
exports.addExpense = async (req, res) => {
  try {
    const { groupId, description, amount, paidBy, splitAmong } = req.body;

    console.log('Received data:', { groupId, description, amount, paidBy, splitAmong });

    if (!groupId || !description || !amount || !paidBy || !splitAmong) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลทั้งหมด' });
    }

    // Verify group exists
    const group = await ExpenseGroup.findById(groupId).catch(err => {
      console.log('GroupId error:', groupId, err);
      return null;
    });
    
    if (!group) {
      return res.status(404).json({ message: 'ไม่พบกลุ่มนี้' });
    }

    const amountNum = parseFloat(amount);
    
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ message: 'ยอดรวมต้องเป็นตัวเลขมากกว่า 0' });
    }

    const splitCount = Array.isArray(splitAmong) ? splitAmong.length : 1;
    const splitAmount = amountNum / splitCount;

    let splitList = [];
    if (Array.isArray(splitAmong)) {
      splitList = splitAmong.map(name => ({
        name: name,
        amount: splitAmount
      }));
    } else {
      splitList = [{ name: splitAmong, amount: splitAmount }];
    }

    const expense = new Expense({
      group: groupId,
      description: description,
      amount: amountNum,
      paidBy: {
        name: paidBy,
        id: null
      },
      splitAmong: splitList
    });

    await expense.save();
    res.status(201).json({ message: 'เพิ่มค่าใช้จ่ายสำเร็จ', expenseId: expense._id });
  } catch (error) {
    console.log('Add Expense Error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด: ' + error.message });
  }
};

// Calculate who owes whom
function calculateSettlements(expenses, members) {
  const balances = {};

  // Initialize balances
  members.forEach(member => {
    balances[member.name] = 0;
  });

  // Process expenses
  expenses.forEach(expense => {
    const paidBy = expense.paidBy.name;
    
    // Person who paid gets positive amount
    balances[paidBy] += expense.amount;

    // Each person in split owes negative amount
    expense.splitAmong.forEach(person => {
      balances[person.name] -= person.amount;
    });
  });

  // Generate settlement transactions
  const settlements = [];
  const debtors = [];
  const creditors = [];

  Object.entries(balances).forEach(([name, balance]) => {
    if (balance < 0) {
      debtors.push({ name, amount: Math.abs(balance) });
    } else if (balance > 0) {
      creditors.push({ name, amount: balance });
    }
  });

  // Match debtors with creditors
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const settleAmount = Math.min(debtor.amount, creditor.amount);

    settlements.push({
      from: debtor.name,
      to: creditor.name,
      amount: settleAmount
    });

    debtor.amount -= settleAmount;
    creditor.amount -= settleAmount;

    if (debtor.amount === 0) i++;
    if (creditor.amount === 0) j++;
  }

  return settlements;
}

exports.deleteExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    await Expense.findByIdAndDelete(expenseId);
    res.status(200).json({ message: 'ลบค่าใช้จ่ายสำเร็จ' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    await ExpenseGroup.findByIdAndDelete(groupId);
    await Expense.deleteMany({ group: groupId });
    res.status(200).json({ message: 'ลบกลุ่มสำเร็จ' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
};
