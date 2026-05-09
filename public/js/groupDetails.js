// Mode toggle
document.querySelectorAll('input[name="inputMode"]').forEach(radio => {
  radio.addEventListener('change', () => {
    const isSlip = document.getElementById('modeSlip').checked;
    document.getElementById('slipSection').classList.toggle('d-none', !isSlip);
    document.getElementById('manualSection').classList.toggle('d-none', isSlip);
  });
});

// Submit
document.getElementById('addExpenseForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const isSlip = document.getElementById('modeSlip').checked;
  const groupId = document.getElementById('groupId').value;
  const description = document.getElementById('description').value.trim();
  const paidBy = document.getElementById('paidBy').value;
  const amountRaw = isSlip
    ? document.getElementById('amountSlip').value
    : document.getElementById('amountManual').value;
  const amount = parseFloat(amountRaw);

  const checkboxes = document.querySelectorAll('input[name="splitAmong"]:checked');
  const splitAmong = Array.from(checkboxes).map(cb => cb.value);

  if (!description || !amountRaw || !paidBy) {
    alert('กรุณากรอกรายละเอียด ยอดรวม และ จ่ายโดย');
    return;
  }

  if (isNaN(amount) || amount <= 0) {
    alert('ยอดรวมต้องเป็นตัวเลขมากกว่า 0');
    return;
  }

  if (splitAmong.length === 0) {
    alert('กรุณาเลือกอย่างน้อยหนึ่งคนในการแบ่งค่าใช้จ่าย');
    return;
  }

  try {
    const response = await fetch('/expense/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId, description, amount, paidBy, splitAmong })
    });

    const data = await response.json();

    if (response.ok) {
      alert(data.message);
      bootstrap.Modal.getInstance(document.getElementById('addExpenseModal')).hide();
      window.location.reload();
    } else {
      alert('Error: ' + data.message);
    }
  } catch (error) {
    alert('เกิดข้อผิดพลาด: ' + error.message);
  }
});

// Reset form when modal closes
document.getElementById('addExpenseModal').addEventListener('hidden.bs.modal', () => {
  document.querySelectorAll('input[name="splitAmong"]').forEach(cb => cb.checked = false);
  document.getElementById('modeSlip').checked = true;
  document.getElementById('slipSection').classList.remove('d-none');
  document.getElementById('manualSection').classList.add('d-none');
  document.getElementById('slipPreview').classList.add('d-none');
  document.getElementById('slipPlaceholder').classList.remove('d-none');
  document.getElementById('ocrStatus').textContent = '';
  document.getElementById('amountSlip').value = '';
  document.getElementById('amountManual').value = '';
  document.getElementById('slipUpload').value = '';
});

// Slip OCR
document.getElementById('slipUpload').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const statusEl = document.getElementById('ocrStatus');
  const previewEl = document.getElementById('slipPreview');
  const placeholderEl = document.getElementById('slipPlaceholder');
  const imgEl = document.getElementById('slipImg');

  imgEl.src = URL.createObjectURL(file);
  previewEl.classList.remove('d-none');
  placeholderEl.classList.add('d-none');

  statusEl.innerHTML = '<span class="text-muted">กำลังอ่านสลิป...</span>';

  try {
    const base64 = await fileToBase64(file);
    const response = await fetch('/api/ocr-slip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64, mimeType: file.type })
    });

    const data = await response.json();

    if (!response.ok) {
      statusEl.innerHTML = `<span class="text-danger">${data.error || 'อ่านสลิปไม่สำเร็จ'}</span>`;
      return;
    }

    if (data.amount) {
      document.getElementById('amountSlip').value = data.amount.toFixed(2);
      statusEl.innerHTML = `<span class="text-success">อ่านได้ ${data.amount.toFixed(2)} บาท</span>`;
    } else {
      statusEl.innerHTML = '<span class="text-warning">ไม่พบยอดเงิน กรุณากรอกเอง</span>';
    }
  } catch (err) {
    statusEl.innerHTML = '<span class="text-danger">เกิดข้อผิดพลาด</span>';
  }
});

function deleteExpense(expenseId, groupId) {
  if (confirm('คุณแน่ใจหรือว่าต้องการลบค่าใช้จ่ายนี้?')) {
    fetch(`/expense/${expenseId}`, { method: 'DELETE' })
      .then(r => r.json())
      .then(data => { alert(data.message); window.location.reload(); })
      .catch(() => alert('เกิดข้อผิดพลาด'));
  }
}

// PromptPay QR
let qrAmount = 0;

function openQrModal(recipient, amount) {
  qrAmount = parseFloat(amount);
  document.getElementById('qrRecipient').textContent = recipient;
  document.getElementById('qrAmount').textContent = `${parseFloat(amount).toFixed(2)} บาท`;
  document.getElementById('promptpayPhone').value = '';
  document.getElementById('qrImageWrap').classList.add('d-none');
  new bootstrap.Modal(document.getElementById('qrModal')).show();
}

function generateQr() {
  const phone = document.getElementById('promptpayPhone').value.trim();
  if (!phone || phone.length < 9) {
    alert('กรุณากรอกเบอร์ PromptPay ให้ถูกต้อง');
    return;
  }

  const payload = buildPromptPayPayload(phone, qrAmount);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(payload)}&size=250x250&ecc=M`;

  const img = document.getElementById('qrImage');
  img.src = qrUrl;
  document.getElementById('qrImageWrap').classList.remove('d-none');
}

function buildPromptPayPayload(phone, amount) {
  const normalizePhone = (p) => {
    p = p.replace(/\D/g, '');
    if (p.startsWith('0')) p = '66' + p.slice(1);
    return '0066' + (p.startsWith('66') ? p.slice(2) : p);
  };

  const tag = (id, value) => `${id}${String(value.length).padStart(2, '0')}${value}`;

  const merchantInfo = tag('00', 'A000000677010111') + tag('01', normalizePhone(phone));
  const amountStr = amount.toFixed(2);

  const body =
    tag('00', '01') +
    tag('01', '12') +
    tag('29', merchantInfo) +
    tag('53', '764') +
    tag('54', amountStr) +
    tag('58', 'TH') +
    '6304';

  return body + crc16(body);
}

function crc16(str) {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const MAX_PX = 1600;
      let { width, height } = img;

      if (width > MAX_PX || height > MAX_PX) {
        const ratio = Math.min(MAX_PX / width, MAX_PX / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);

      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.8).split(',')[1]);
    };

    img.onerror = reject;
    img.src = url;
  });
}
