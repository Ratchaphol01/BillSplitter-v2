document.getElementById('addExpenseForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const groupId = document.getElementById('groupId').value;
  const description = document.getElementById('description').value;
  const amount = document.getElementById('amount').value;
  const paidBy = document.getElementById('paidBy').value;

  // Get selected members
  const checkboxes = document.querySelectorAll('input[name="splitAmong"]:checked');
  const splitAmong = Array.from(checkboxes).map(cb => cb.value);

  if (!description || !amount || !paidBy) {
    alert('กรุณากรอกรายละเอียด ยอดรวม และ จ่ายโดย');
    return;
  }

  if (splitAmong.length === 0) {
    alert('กรุณาเลือกอย่างน้อยหนึ่งคนในการแบ่งค่าใช้จ่าย');
    return;
  }

  try {
    const response = await fetch('/expense/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        groupId,
        description,
        amount: parseFloat(amount),
        paidBy,
        splitAmong
      })
    });

    const data = await response.json();

    if (response.ok) {
      alert(data.message);
      const modal = bootstrap.Modal.getInstance(document.getElementById('addExpenseModal'));
      modal.hide();
      window.location.reload();
    } else {
      alert('Error: ' + data.message);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('เกิดข้อผิดพลาด: ' + error.message);
  }
});

function deleteExpense(expenseId, groupId) {
  if (confirm('คุณแน่ใจหรือว่าต้องการลบค่าใช้จ่ายนี้?')) {
    fetch(`/expense/${expenseId}`, {
      method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
      alert(data.message);
      window.location.reload();
    })
    .catch(error => {
      console.error('Error:', error);
      alert('เกิดข้อผิดพลาด');
    });
  }
}

// Auto-select all members when form opens
const modal = document.getElementById('addExpenseModal');
modal.addEventListener('show.bs.modal', function() {
  const checkboxes = document.querySelectorAll('input[name="splitAmong"]');
  checkboxes.forEach(cb => cb.checked = false);
});

// Slip OCR
document.getElementById('slipUpload').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const statusEl = document.getElementById('ocrStatus');
  const previewEl = document.getElementById('slipPreview');
  const imgEl = document.getElementById('slipImg');

  // Show preview
  const objectUrl = URL.createObjectURL(file);
  imgEl.src = objectUrl;
  previewEl.classList.remove('d-none');

  statusEl.textContent = 'กำลังอ่านสลิป...';
  statusEl.className = 'text-muted small';

  try {
    const base64 = await fileToBase64(file);
    const response = await fetch('/api/ocr-slip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64, mimeType: file.type })
    });

    const data = await response.json();

    if (!response.ok) {
      statusEl.textContent = data.error || 'อ่านสลิปไม่สำเร็จ';
      statusEl.className = 'text-danger small';
      return;
    }

    if (data.amount) {
      document.getElementById('amount').value = data.amount.toFixed(2);
      statusEl.textContent = `อ่านได้ ${data.amount.toFixed(2)} บาท`;
      statusEl.className = 'text-success small';
    } else {
      statusEl.textContent = 'ไม่พบยอดเงินในสลิป กรุณากรอกเอง';
      statusEl.className = 'text-warning small';
    }
  } catch (err) {
    statusEl.textContent = 'เกิดข้อผิดพลาด';
    statusEl.className = 'text-danger small';
  }
});

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
