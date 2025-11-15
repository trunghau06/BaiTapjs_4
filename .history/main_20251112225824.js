const API_URL           = "https://671891927fc4c5ff8f49fcac.mockapi.io/v2";
const itemsPerPage      = 15;
let loading             = false;
let isEditMode          = false;
let editingUser         = null;

const ROW_HEIGHT        = 50;
const VISIBLE_ROWS      = 18;
const RENDER_WINDOW     = VISIBLE_ROWS + 6;
let totalRecords        = 0;
let renderedElements    = [];
let fullDataStore       = {};
let lastScrollTop       = 0;

const tableBodyElement = document.getElementById("tableBody");
const cardViewElement  = document.getElementById("cardView");
const loaderElement    = document.getElementById("loader");
const scrollContainer  = document.getElementById("cardsContainer");
const tableSection     = document.getElementById("tableView");
const cardSection      = document.getElementById("cardView");
const fakeScrollBar    = document.querySelector(".fake-scroll-wrapper");
const addRecordBtn     = document.getElementById("addRecordBtn");
const addRecordModal   = document.getElementById("addRecordModal");
const addRecordForm    = document.getElementById("addRecordForm");
const closeModalBtn    = document.getElementById("closeModalBtn");
const cancelBtn        = document.getElementById("cancelBtn");
const avatarFileInput  = document.getElementById("avatarFile");
const avatarPreview    = document.getElementById("avatarPreview");
const submitBtn        = addRecordForm.querySelector(".btn-submit");

function checkMobileView() {
    return window.innerWidth <= 768;
}

function resetAvatarPreview() {
    avatarPreview.innerHTML = '<i class="fa-solid fa-user" style="font-size: 40px; color: #ccc;">';
}

function openAddModal() {
    isEditMode = false;
    editingUser = null;
    addRecordModal.style.display = "flex";
    addRecordForm.reset();
    resetAvatarPreview();
    submitBtn.textContent = "Thêm Record";
    addRecordModal.querySelector("h2").textContent = "Thêm Record Mới";
}

function closeModal() {
    addRecordModal.style.display = "none";
    addRecordForm.reset();
    resetAvatarPreview();
    submitBtn.textContent = "Thêm Record";
}

addRecordBtn.addEventListener("click", openAddModal);
closeModalBtn.addEventListener("click", closeModal);
cancelBtn.addEventListener("click", closeModal);
addRecordModal.addEventListener("click", (e) => {
    if (e.target === addRecordModal) closeModal();
});

avatarFileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            avatarPreview.innerHTML = `<img src="${event.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(file);
    }
});

addRecordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(addRecordForm);

    let avatarUrl = editingUser?.avatar || ""; 
    const avatarFile = formData.get("avatarFile");

    if (!isEditMode) {
        if (!avatarFile || avatarFile.size === 0) {
            alert("Vui lòng chọn ảnh avatar!");
            return;
        }
        avatarUrl = await resizeImage(avatarFile, 80, 80);
    } else {
        if (avatarFile && avatarFile.size > 0) {
            avatarUrl = await resizeImage(avatarFile, 80, 80);
        }
    }

    const recordData = {
        avatar   : avatarUrl,
        name     : formData.get("name"),
        color    : formData.get("color") || editingUser?.color || "#ffffff",
        company  : formData.get("company"),
        genre    : formData.get("genre"),
        email    : formData.get("email"),
        phone    : formData.get("phone"),
        dob      : formData.get("dob"),
        timezone : formData.get("timezone"),
        music    : formData.get("music"),
        city     : formData.get("city"),
        state    : formData.get("state"),
        address  : formData.get("address"),
        street   : formData.get("street"),
        building : formData.get("building"),
        zip      : formData.get("zip"),
        password : formData.get("password"),
        createdAt: isEditMode ? editingUser.createdAt : new Date().toISOString()
    };

    if (isEditMode) {
        await editRecordById(editingUser.id, recordData);
    } else {
        await addNewRecordAtStart(recordData);
    }

    closeModal();
});

async function addNewRecordAtStart(record) {
    try {
        const response = await fetch(API_URL, {
            method : "POST",
            headers: { "Content-Type": "application/json" },
            body   : JSON.stringify(record)
        });
        const addedData = await response.json();
        
        totalRecords++;
        
        let newStore = {};
        newStore[0] = addedData;
        for (let i = 0; i < totalRecords - 1; i++) {
            newStore[i + 1] = fullDataStore[i];
        }
        fullDataStore = newStore;
        
        scrollContainer.style.height = `${totalRecords * ROW_HEIGHT}px`;
        updateVirtualView();
        
    } catch (error) {
        console.error("Lỗi khi thêm record:", error);
        alert("Lỗi khi thêm record!");
    }
}

function resizeImage(file, maxWidth = 80, maxHeight = 80) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                let { width, height } = img;
                if (width > maxWidth) {
                    height = height * (maxWidth / width);
                    width = maxWidth;
                }
                if (height > maxHeight) {
                    width = width * (maxHeight / height);
                    height = maxHeight;
                }
                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL("image/png"));
            };
            img.onerror = reject;
            img.src = event.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function editRecordById(id, updates) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method : "PUT",
            headers: { "Content-Type": "application/json" },
            body   : JSON.stringify(updates)
        });
        if (!response.ok) throw new Error(`Lỗi khi sửa record id ${id}: ${response.status}`);
        const updatedData = await response.json();
        
        const index = Object.keys(fullDataStore).find(key => fullDataStore[key].id == id);
        if (index !== undefined) {
            fullDataStore[index] = updatedData;
            updateVirtualView();
        }
    } catch (error) {
        console.error(error);
    }
}

function switchViewMode() {
    if (checkMobileView()) {
        tableSection.style.display = 'none';
        cardSection.style.display  = 'flex';
        if (fakeScrollBar) fakeScrollBar.style.display = 'none';
    } else {
        tableSection.style.display = 'block';
        cardSection.style.display  = 'none';
        if (fakeScrollBar) fakeScrollBar.style.display = 'block';
    }
}

async function fetchInitialData() {
    try {
        const response = await fetch(`${API_URL}?page=1&limit=100&sortBy=id&order=asc`); 
        const allData = await response.json();
        
        allData.forEach((item, index) => {
             fullDataStore[index] = item;
        });

        totalRecords = allData.length;
        
        for (let i = 0; i < RENDER_WINDOW; i++) {
            const row = createTableRow(fullDataStore[i]);
            tableBodyElement.appendChild(row);
            renderedElements.push(row);
            
            const card = createCardElement(fullDataStore[i]);
            cardViewElement.appendChild(card);
        }
        
        scrollContainer.style.height = `${totalRecords * ROW_HEIGHT}px`;
        
        loaderElement.style.display = "none";
        scrollContainer.style.display = "block";
        
        updateVirtualView();
        
    } catch (error) {
        console.error("Lỗi tải dữ liệu ban đầu:", error);
    }
}

function updateVirtualView() {
    if (totalRecords === 0) return;
    
    const scrollTop = scrollContainer.scrollTop;
    
    const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 3);
    
    const offset = startIndex * ROW_HEIGHT;
    
    for (let i = 0; i < RENDER_WINDOW; i++) {
        const dataIndex = startIndex + i;
        const row = renderedElements[i];

        if (dataIndex < totalRecords) {
            const user = fullDataStore[dataIndex];
            
            updateRowContent(row, user, i); 
                 
            row.style.transform = `translateY(${offset}px)`;
            row.style.position = 'absolute'; 
            row.style.display = ''; 
        } else {
            if (row) row.style.display = 'none';
        }
    }
}

function updateRowContent(domElement, user, renderIndex) {
    if (!user || !domElement) return;

    const isMale = user.genre?.toLowerCase() === 'male';
    const genderBadgeClass = isMale ? 'badge-male' : 'badge-female';
    const genderLabel = isMale ? 'Nam' : 'Nữ';
    const genderIconClass = isMale ? 'fa-mars' : 'fa-venus';
    
    domElement.style.backgroundColor = lightenColor(user.color || "#FFFFFF", 70);
    domElement.setAttribute("data-id", user.id); 

    if (domElement.tagName === 'TR') {
        const cellsData = [
            user.id,
            `<img src="${user.avatar || 'https://via.placeholder.com/40'}" alt="${user.name}" class="avatar-small">`,
            user.name, user.company,
            `<span class="card-badge ${genderBadgeClass}"><i class="fa-solid ${genderIconClass}"></i> ${genderLabel}</span>`,
            user.email, user.phone, user.dob, user.color, user.timezone, user.music,
            user.city, user.state, user.address, user.street, user.building,
            user.zip || user.zipcode, user.createdAt, user.password
        ];
        
        const existingCells = domElement.querySelectorAll('td');
        
        for (let i = 1; i < existingCells.length; i++) {
            existingCells[i].innerHTML = cellsData[i - 1] || "N/A";
        }

    } else if (domElement.className === 'card') {
        domElement.querySelector('.card-name').textContent = user.name || 'N/A';
        domElement.querySelector('.card-company').textContent = user.company || 'N/A';
        
        // Cập nhật các trường card-item (logic phức tạp hơn, chỉ cập nhật vài trường chính)
        domElement.querySelector('[data-field="id"]').innerHTML = `<strong>ID:</strong> ${user.id || 'N/A'}`;
        domElement.querySelector('[data-field="email"]').innerHTML = `<strong>Email:</strong> ${user.email || 'N/A'}`;
    }
}


function lightenColor(hexColor, percent) {
    hexColor = hexColor.replace("#","");
    let r = parseInt(hexColor.substring(0,2),16);
    let g = parseInt(hexColor.substring(2,4),16);
    let b = parseInt(hexColor.substring(4,6),16);
    r = Math.min(255, Math.floor(r + (255 - r) * percent/100));
    g = Math.min(255, Math.floor(g + (255 - g) * percent/100));
    b = Math.min(255, Math.floor(b + (255 - b) * percent/100));
    return `rgb(${r},${g},${b})`;
}

function createTableRow(user) {
    const isMale = user.genre?.toLowerCase() === 'male';
    const genderBadgeClass = isMale ? 'badge-male' : 'badge-female';
    const genderLabel = isMale ? 'Nam' : 'Nữ';
    const genderIconClass = isMale ? 'fa-mars' : 'fa-venus';

    const tableRow = document.createElement("tr");
    tableRow.setAttribute("data-id", user.id);
    tableRow.className = "data-row";
    tableRow.style.backgroundColor = lightenColor(user.color || "#FFFFFF", 70);

    const cellsContent = [
        user.id,
        `<img src="${user.avatar || 'https://via.placeholder.com/40'}" alt="${user.name}" class="avatar-small">`,
        user.name, user.company,
        `<span class="card-badge ${genderBadgeClass}"><i class="fa-solid ${genderIconClass}"></i> ${genderLabel}</span>`,
        user.email, user.phone, user.dob, user.color, user.timezone, user.music,
        user.city, user.state, user.address, user.street, user.building,
        user.zip || user.zipcode, user.createdAt, user.password
    ];

    const actionTd = document.createElement("td");
    actionTd.style.textAlign = "center";
    actionTd.innerHTML = `
        <button class="btn-action edit-icon" title="Chỉnh sửa"><i class="fa-solid fa-pen"></i></button>
        <button class="btn-action delete-icon" title="Xóa"><i class="fa-solid fa-trash"></i></button>
    `;
    
    tableRow.appendChild(actionTd); 
    
    cellsContent.forEach(content => {
        const td = document.createElement("td");
        td.innerHTML = content || "N/A";
        tableRow.appendChild(td);
    });
    
    attachRowEvents(tableRow, user);
    return tableRow;
}

function createCardElement(user) {
    const isMale = user.genre?.toLowerCase() === 'male';
    const genderBadgeClass = isMale ? 'badge-male' : 'badge-female';
    const genderLabel = isMale ? 'Nam' : 'Nữ';
    const genderIconClass = isMale ? 'fa-mars' : 'fa-venus';
    
    const card = document.createElement("div");
    card.className = "card";
    card.setAttribute("data-id", user.id);
    card.style.backgroundColor = lightenColor(user.color || "#FFFFFF", 70);

    card.innerHTML = `
        <div class="card-header">
            <img src="${user.avatar || 'https://via.placeholder.com/60'}" alt="${user.name}" class="avatar">
            <div class="card-info">
                <div class="card-name">${user.name || 'N/A'}</div>
                <div class="card-company">${user.company || 'N/A'}</div>
            </div>
            <span class="card-badge ${genderBadgeClass}"><i class="fa-solid ${genderIconClass}"></i> ${genderLabel}</span>
        </div>
        <div class="card-body">
            <div class="card-item" data-field="id"><strong>ID:</strong> ${user.id || 'N/A'}</div>
            <div class="card-item" data-field="createdAt"><strong>Created At:</strong> ${user.createdAt || 'N/A'}</div>
            <div class="card-item" data-field="name"><strong>Name:</strong> ${user.name || 'N/A'}</div>
            <div class="card-item" data-field="genre"><strong>Genre:</strong> ${user.genre || 'N/A'}</div>
            <div class="card-item" data-field="company"><strong>Company:</strong> ${user.company || 'N/A'}</div>
            <div class="card-item" data-field="dob"><strong>DOB:</strong> ${user.dob || 'N/A'}</div>
            <div class="card-item" data-field="color"><strong>Color:</strong> ${user.color || 'N/A'}</div>
            <div class="card-item" data-field="timezone"><strong>Timezone:</strong> ${user.timezone || 'N/A'}</div>
            <div class="card-item" data-field="music"><strong>Music:</strong> ${user.music || 'N/A'}</div>
            <div class="card-item" data-field="address"><strong>Address:</strong> ${user.address || 'N/A'}</div>
            <div class="card-item" data-field="city"><strong>City:</strong> ${user.city || 'N/A'}</div>
            <div class="card-item" data-field="state"><strong>State:</strong> ${user.state || 'N/A'}</div>
            <div class="card-item" data-field="street"><strong>Street:</strong> ${user.street || 'N/A'}</div>
            <div class="card-item" data-field="building"><strong>Building:</strong> ${user.building || 'N/A'}</div>
            <div class="card-item" data-field="zip"><strong>ZIP:</strong> ${user.zip || user.zipcode || 'N/A'}</div>
            <div class="card-item" data-field="email"><strong>Email:</strong> ${user.email || 'N/A'}</div>
            <div class="card-item" data-field="phone"><strong>Phone:</strong> ${user.phone || 'N/A'}</div>
            <div class="card-item" data-field="password"><strong>Password:</strong> ${user.password || 'N/A'}</div>
        </div>
        <div class="card-actions">
            <button class="btn-action edit-icon" title="Chỉnh sửa"><i class="fa-solid fa-pen"></i></button>
            <button class="btn-action delete-icon" title="Xóa"><i class="fa-solid fa-trash"></i></button>
        </div>
    `;
    attachCardEvents(card, user);
    return card;
}

function attachRowEvents(tableRow, user) {
    const editIcon = tableRow.querySelector(".edit-icon");
    const deleteIcon = tableRow.querySelector(".delete-icon");

    editIcon.addEventListener("click", () => openEditModal(user));
    deleteIcon.addEventListener("click", async () => await deleteRecord(user));
}

function attachCardEvents(cardElement, user) {
    const editIcon = cardElement.querySelector(".edit-icon");
    const deleteIcon = cardElement.querySelector(".delete-icon");

    editIcon.addEventListener("click", () => openEditModal(user));
    deleteIcon.addEventListener("click", async () => await deleteRecord(user));
}

async function deleteRecord(user) {
    if (!confirm(`Bạn chắc chắn muốn xóa record id ${user.id}?`)) return;
    try {
        const res = await fetch(`${API_URL}/${user.id}`, { method: "DELETE" });
        if (res.ok) {
            
            const indexToDelete = Object.keys(fullDataStore).find(key => fullDataStore[key] && fullDataStore[key].id == user.id);
            if (indexToDelete !== undefined) {
                // Xóa khỏi store
                delete fullDataStore[indexToDelete];
                totalRecords--;

                // Cập nhật lại key index sau khi xóa (quan trọng)
                let newStore = {};
                let j = 0;
                for (let i = 0; i < totalRecords + 1; i++) {
                    if (fullDataStore[i] !== undefined) {
                        newStore[j] = fullDataStore[i];
                        j++;
                    }
                }
                fullDataStore = newStore;
            }
            
            updateVirtualView();
        } else alert("Xóa thất bại!");
    } catch (err) {
        console.error(err);
        alert("Lỗi khi xóa record!");
    }
}

function formatDobForInput(dobString) {
    if (!dobString) return "";
    
    let date = new Date(dobString);

    if (isNaN(date.getTime())) {
        const parts = dobString.split('-');
        if (parts.length === 3) {
            date = new Date(parts[0], parts[1]-1, parts[2]);
        } else return "";
    }

    const year    = date.getFullYear();
    const month   = String(date.getMonth() + 1).padStart(2, '0');
    const day     = String(date.getDate()).padStart(2, '0');
    const hours   = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}


function openEditModal(user) {
    isEditMode  = true;
    editingUser = user;
    addRecordModal.style.display = "flex";

    addRecordForm.name.value     = user.name || "";
    addRecordForm.company.value  = user.company || "";
    addRecordForm.genre.value    = user.genre || "";
    addRecordForm.email.value    = user.email || "";
    addRecordForm.phone.value    = user.phone || "";
    
    if (user.dob) {
        const d = new Date(user.dob);
        addRecordForm.dob.value = formatDobForInput(user.dob);
    } else addRecordForm.dob.value = "";

    addRecordForm.color.value    = user.color || "#ffffff";
    addRecordForm.timezone.value = user.timezone || "";
    addRecordForm.music.value    = user.music || "";
    addRecordForm.city.value     = user.city || "";
    addRecordForm.state.value    = user.state || "";
    addRecordForm.address.value  = user.address || "";
    addRecordForm.street.value   = user.street || "";
    addRecordForm.building.value = user.building || "";

    addRecordForm.zip.value      = user.zip || user.zipcode || "";

    addRecordForm.password.value = user.password || "";

    avatarPreview.innerHTML = user.avatar
        ? `<img src="${user.avatar}" alt="Preview">`
        : '<i class="fa-solid fa-user" style="font-size: 40px; color: #ccc;"></i>';

    addRecordModal.querySelector("h2").textContent = "Chỉnh Sửa Record";
    submitBtn.textContent = "Chỉnh sửa";
}

scrollContainer.addEventListener("scroll", updateVirtualView);


window.addEventListener('resize', switchViewMode);

switchViewMode();
fetchInitialData();