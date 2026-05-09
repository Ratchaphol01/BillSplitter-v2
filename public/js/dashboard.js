let membersList = [];

// Add member functionality
document.getElementById('addMemberBtn').addEventListener('click', () => {
  const input = document.getElementById('memberInput');
  const memberName = input.value.trim();

  if (!memberName) {
    alert('กรุณากรอกชื่อเพื่อน');
    return;
  }

  if (membersList.includes(memberName)) {
    alert('ชื่อนี้มีอยู่แล้ว');
    return;
  }

  membersList.push(memberName);
  input.value = '';
  renderMembers();
  input.focus();
});

// Allow Enter key to add member
document.getElementById('memberInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('addMemberBtn').click();
    e.preventDefault();
  }
});

function renderMembers() {
  const container = document.getElementById('membersList');
  container.innerHTML = '';

  membersList.forEach((member, index) => {
    const badge = document.createElement('span');
    badge.className = 'badge bg-primary me-2 mb-2';
    badge.innerHTML = `
      ${member}
      <button type="button" class="btn-close btn-close-white ms-1" onclick="removeMember(${index})" style="font-size: 0.7rem;"></button>
    `;
    container.appendChild(badge);
  });

  // Update hidden input
  document.getElementById('membersArray').value = membersList.join(',');
}

function removeMember(index) {
  membersList.splice(index, 1);
  renderMembers();
}

document.getElementById('createGroupForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const groupName = document.getElementById('groupName').value.trim();
  const groupDescription = document.getElementById('groupDescription').value.trim();

  if (!groupName) {
    alert('กรุณากรอกชื่อกลุ่ม');
    return;
  }

  if (membersList.length === 0) {
    alert('กรุณาเพิ่มสมาชิกอย่างน้อยหนึ่งคน');
    return;
  }

  try {
    const response = await fetch('/expense/group/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        groupName,
        groupDescription,
        members: membersList
      })
    });

    const data = await response.json();

    if (response.ok) {
      alert(data.message);
      membersList = [];
      document.getElementById('createGroupForm').reset();
      document.getElementById('membersList').innerHTML = '';
      window.location.reload();
    } else {
      alert(data.message || 'เกิดข้อผิดพลาด');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('เกิดข้อผิดพลาด: ' + error.message);
  }
});

function deleteGroup(groupId) {
  if (confirm('คุณแน่ใจหรือว่าต้องการลบกลุ่มนี้?')) {
    fetch(`/expense/group/${groupId}`, {
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
