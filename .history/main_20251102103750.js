const API_URL = "https://671891927fc4c5ff8f49fcac.mockapi.io/v2";
let page = 1;
const batchSize = 20;
const maxDomItems = 15; // số item tối đa giữ trên DOM
let isLoading = false;
let hasMore = true;

const tableBody = document.getElementById("table-body");
const cardView = document.getElementById("card-view");
const loader = document.getElementById("loader");
const container = document.getElementById("table-container"); // container scroll (table hoặc card)

// -------------------- Fetch Data --------------------
async function fetchData() {
  if (!hasMore || isLoading) return;

  isLoading = true;
  loader.style.display = "block";

  try {
    const res = await fetch(`${API_URL}?page=${page}&limit=${batchSize}`);
    const result = await res.json();

    if (result.length === 0) {
      hasMore = false;
    } else {
      renderBatch(result);
      page++;
    }
  } catch (err) {
    console.error(err);
  }

  loader.style.display = "none";
  isLoading = false;
}

// -------------------- Render Batch --------------------
function renderBatch(users) {
  users.forEach(user => {
    // -------- Table row --------
    const tr = document.createElement("tr");
    tr.setAttribute("data-id", user.id);
    tr.style.backgroundColor = user.color || "#fff";
    tr.innerHTML = `
      <td>${user.id || ''}</td>
      <td><img src="${user.avatar || 'https://via.placeholder.com/40'}" style="width:40px;height:40px;border-radius:50%;"></td>
      <td>${user.name || 'N/A'}</td>
      <td>${user.genre || 'N/A'}</td>
      <td>${user.email || 'N/A'}</td>
      <td>${user.company || 'N/A'}</td>
      <td>${user.phone || 'N/A'}</td>
      <td>${user.dob || 'N/A'}</td>
      <td>${user.timezone || 'N/A'}</td>
      <td>${user.music || 'N/A'}</td>
      <td>${user.city || 'N/A'}</td>
      <td>${user.state || 'N/A'}</td>
      <td>${user.address || 'N/A'}</td>
      <td>${user.street || 'N/A'}</td>
      <td>${user.building || 'N/A'}</td>
      <td>${user.zip || user.zipcode || 'N/A'}</td>
      <td>${user.createdAt || 'N/A'}</td>
      <td>${user.password || 'N/A'}</td>
    `;
    tableBody.appendChild(tr);

    // -------- Card --------
    const card = document.createElement("div");
    card.setAttribute("data-id", user.id);
    card.className = "card";
    card.style.backgroundColor = user.color || "#fff";
    card.innerHTML = `
      <img src="${user.avatar || 'https://via.placeholder.com/60'}" alt="${user.name}" class="avatar">
      <div class="card-info">
        <div><strong>ID:</strong> ${user.id || ''}</div>
        <div><strong>Name:</strong> ${user.name || 'N/A'}</div>
        <div><strong>Genre:</strong> ${user.genre || 'N/A'}</div>
        <div><strong>Email:</strong> ${user.email || 'N/A'}</div>
        <div><strong>Company:</strong> ${user.company || 'N/A'}</div>
        <div><strong>Phone:</strong> ${user.phone || 'N/A'}</div>
        <div><strong>DOB:</strong> ${user.dob || 'N/A'}</div>
        <div><strong>Timezone:</strong> ${user.timezone || 'N/A'}</div>
        <div><strong>Music:</strong> ${user.music || 'N/A'}</div>
        <div><strong>City:</strong> ${user.city || 'N/A'}</div>
        <div><strong>State:</strong> ${user.state || 'N/A'}</div>
        <div><strong>Address:</strong> ${user.address || 'N/A'}</div>
        <div><strong>Street:</strong> ${user.street || 'N/A'}</div>
        <div><strong>Building:</strong> ${user.building || 'N/A'}</div>
        <div><strong>ZIP:</strong> ${user.zip || user.zipcode || 'N/A'}</div>
        <div><strong>Created At:</strong> ${user.createdAt || 'N/A'}</div>
        <div><strong>Password:</strong> ${user.password || 'N/A'}</div>
      </div>
    `;
    cardView.appendChild(card);
  });

  // -------- Giữ tối đa maxDomItems --------
  trimDom(tableBody);
  trimDom(cardView);
}

// -------------------- Giữ DOM tối đa --------
function trimDom(container) {
  while (container.children.length > maxDomItems) {
    container.removeChild(container.children[0]); // remove item cũ từ trên
  }
}

// -------------------- Scroll Event --------
container.addEventListener("scroll", () => {
  const { scrollTop, scrollHeight, clientHeight } = container;
  if (scrollTop + clientHeight >= scrollHeight - 20 && !isLoading && hasMore) {
    fetchData();
  }
});

// -------------------- Init --------
fetchData();
