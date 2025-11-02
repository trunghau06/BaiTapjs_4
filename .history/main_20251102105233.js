const API_URL = "https://671891927fc4c5ff8f49fcac.mockapi.io/v2";
let page = 1;
const batchSize = 20;
const maxDomItems = 15; // số item tối đa giữ trên DOM
let isLoading = false;
let hasMore = true;

const tableBody = document.getElementById("tableBody");
const cardView = document.getElementById("cardView");
const loader = document.getElementById("loader");
const loadingMore = document.getElementById("loadingMore");
const container = document.getElementById("cardsContainer");
const tableViewEl = document.getElementById("tableView");
const cardViewEl = document.getElementById("cardView");
const fakeScrollWrapper = document.querySelector(".fake-scroll-wrapper");

// Kiểm tra mobile view
function isMobileView() {
    return window.innerWidth <= 768;
}

// Update view mode
function updateViewMode() {
    if (isMobileView()) {
        tableViewEl.style.display = 'none';
        cardViewEl.style.display = 'flex';
        fakeScrollWrapper.style.display = 'none';
    } else {
        tableViewEl.style.display = 'block';
        cardViewEl.style.display = 'none';
        fakeScrollWrapper.style.display = 'block';
    }
}

// -------------------- Fetch Data --------------------
async function fetchData() {
    if (!hasMore || isLoading) return;

    isLoading = true;
    if (page === 1) {
        loader.style.display = "block";
    } else {
        loadingMore.style.display = "block";
    }

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
    loadingMore.style.display = "none";
    isLoading = false;
}

// -------------------- Render Batch --------------------
function renderBatch(users) {
    users.forEach(user => {
        // -------- Table row --------
        const tr = document.createElement("tr");
        tr.setAttribute("data-id", user.id);
        tr.className = "data-row";
        tr.style.backgroundColor = user.color || "#fff";
        
        const isMale = user.genre?.toLowerCase() === 'male';
        const badgeClass = isMale ? 'badge-male' : 'badge-female';
        const badgeText = isMale ? 'Nam' : 'Nữ';
        const badgeIcon = isMale ? 'fa-mars' : 'fa-venus';
        
        tr.innerHTML = `
            <td>${user.id || 'N/A'}</td>
            <td><img src="${user.avatar || 'https://via.placeholder.com/40'}" class="avatar-small" loading="lazy"></td>
            <td>${user.name || 'N/A'}</td>
            <td>${user.company || 'N/A'}</td>
            <td>
                <span class="card-badge ${badgeClass}">
                    <i class="fa-solid ${badgeIcon}"></i> ${badgeText}
                </span>
            </td>
            <td>${user.email || 'N/A'}</td>
            <td>${user.phone || 'N/A'}</td>
            <td>${user.dob || 'N/A'}</td>
            <td>${user.color || 'N/A'}</td>
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
        
        const genderText = isMale ? 'Nam' : 'Nữ';
        
        card.innerHTML = `
            <div class="card-header">
                <img src="${user.avatar || 'https://via.placeholder.com/60'}" alt="${user.name}" class="avatar" loading="lazy">
                <div class="card-info">
                    <div class="card-name">${user.name || 'N/A'}</div>
                    <div class="card-company">${user.company || 'N/A'}</div>
                </div>
                <span class="card-badge ${badgeClass}">
                    ${genderText}
                </span>
            </div>
            <div class="card-body">
                <div class="card-item"><i class="fa-solid fa-id-badge card-icon"></i> <strong>ID:</strong> ${user.id || 'N/A'}</div>
                <div class="card-item"><i class="fa-regular fa-calendar-plus card-icon"></i> <strong>Created At:</strong> ${user.createdAt || 'N/A'}</div>
                <div class="card-item"><i class="fa-solid fa-user card-icon"></i> <strong>Name:</strong> ${user.name || 'N/A'}</div>
                <div class="card-item"><i class="fa-solid fa-venus-mars card-icon"></i> <strong>Genre:</strong> ${user.genre || 'N/A'}</div>
                <div class="card-item"><i class="fa-solid fa-building card-icon"></i> <strong>Company:</strong> ${user.company || 'N/A'}</div>
                <div class="card-item"><i class="fa-solid fa-calendar-days card-icon"></i> <strong>DOB:</strong> ${user.dob || 'N/A'}</div>
                <div class="card-item"><i class="fa-solid fa-clock card-icon"></i> <strong>Timezone:</strong> ${user.timezone || 'N/A'}</div>
                <div class="card-item"><i class="fa-solid fa-music card-icon"></i> <strong>Music:</strong> ${user.music || 'N/A'}</div>
                <div class="card-item"><i class="fa-solid fa-map-location-dot card-icon"></i> <strong>Address:</strong> ${user.address || 'N/A'}</div>
                <div class="card-item"><i class="fa-solid fa-city card-icon"></i> <strong>City:</strong> ${user.city || 'N/A'}</div>
                <div class="card-item"><i class="fa-solid fa-map card-icon"></i> <strong>State:</strong> ${user.state || 'N/A'}</div>
                <div class="card-item"><i class="fa-solid fa-road card-icon"></i> <strong>Street:</strong> ${user.street || 'N/A'}</div>
                <div class="card-item"><i class="fa-solid fa-building-columns card-icon"></i> <strong>Building:</strong> ${user.building || 'N/A'}</div>
                <div class="card-item"><i class="fa-solid fa-hashtag card-icon"></i> <strong>ZIP:</strong> ${user.zip || user.zipcode || 'N/A'}</div>
                <div class="card-item"><i class="fa-solid fa-envelope card-icon"></i> <strong>Email:</strong> ${user.email || 'N/A'}</div>
                <div class="card-item"><i class="fa-solid fa-phone card-icon"></i> <strong>Phone:</strong> ${user.phone || 'N/A'}</div>
                <div class="card-item"><i class="fa-solid fa-lock card-icon"></i> <strong>Password:</strong> ${user.password || 'N/A'}</div>
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
    if (scrollTop + clientHeight >= scrollHeight - 100 && !isLoading && hasMore) {
        fetchData();
    }
});

// -------------------- Resize Event --------
window.addEventListener('resize', () => {
    updateViewMode();
});

// -------------------- Horizontal Sync --------
if (fakeScrollWrapper) {
    const fakeScroll = document.getElementById('fakeScroll');
    const table = document.querySelector('.data-table');
    
    if (table && fakeScroll) {
        const tableMinWidth = window.getComputedStyle(table).minWidth;
        fakeScroll.style.minWidth = tableMinWidth;
        
        fakeScrollWrapper.addEventListener('scroll', () => {
            container.scrollLeft = fakeScrollWrapper.scrollLeft;
        });
        
        container.addEventListener('scroll', () => {
            if (!isMobileView()) {
                fakeScrollWrapper.scrollLeft = container.scrollLeft;
            }
        });
    }
}

// -------------------- Init --------
updateViewMode();
fetchData();