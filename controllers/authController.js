const User = require('../models/User');

exports.register = async (req, res) => {
  try {
    const { name, email, password, passwordConfirm } = req.body;

    if (!name || !email || !password || !passwordConfirm) {
      return res.status(400).json({
        message: 'กรุณากรอกข้อมูลทั้งหมด'
      });
    }

    if (password !== passwordConfirm) {
      return res.status(400).json({
        message: 'รหัสผ่านไม่ตรงกัน'
      });
    }

    let user = await User.findOne({ email: email });

    if (user) {
      return res.status(400).json({
        message: 'อีเมลนี้มีการลงทะเบียนแล้ว'
      });
    }

    user = new User({ name, email, password });
    await user.save();

    return res.status(201).json({
      message: 'ลงทะเบียนสำเร็จ',
      success: true
    });
  } catch (error) {
    console.log('Register Error:', error);
    return res.status(500).json({
      message: 'เกิดข้อผิดพลาด: ' + error.message
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).render('login', {
        message: 'กรุณากรอกอีเมลและรหัสผ่าน'
      });
    }

    let user = await User.findOne({ email: email });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).render('login', {
        message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
      });
    }

    const id = user.id;
    req.session.userId = id;

    return res.redirect('/expense/dashboard');
  } catch (error) {
    console.log(error);
    return res.status(500).render('login', {
      message: 'เกิดข้อผิดพลาด'
    });
  }
};

exports.logout = (req, res) => {
  req.session.userId = null;
  return res.redirect('/');
};
