const API_URL          = "https://671891927fc4c5ff8f49fcac.mockapi.io/v2";
let currentPage        = 1;
const itemsPerPage     = 15; 
let allLoadedData      = [];
let loading            = false;
let moreDataAvailable  = true;
let isEditMode         = false;
let editingUser        = null;

const tableBodyElement = document.getElementById("tableBody");
const cardViewElement  = document.getElementById("cardView");
const loaderElement    = document.getElementById("loader");
const loadMoreElement  = document.getElementById("loadingMore");
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

function checkMobileView() {
    return window.innerWidth <= 768;
}

async function addNewRecordAtStart(record) {
    try {
        const response = await fetch(API_URL, {
            method : "POST",
            headers: { "Content-Type": "application/json" },
            body   : JSON.stringify(record)
        });
        const addedData = await response.json();
        allLoadedData.unshift(addedData);
        renderTable(allLoadedData);
    } catch (error) {
        console.error("Lỗi khi thêm record:", error);
        alert("Lỗi khi thêm record!");
    }
}

addRecordBtn.addEventListener("click", () => {
    isEditMode = false;
    editingUser = null;
    addRecordModal.style.display = "flex";
    addRecordForm.reset();
    resetAvatarPreview();
});

closeModalBtn.addEventListener("click", () => {
    addRecordModal.style.display = "none";
    addRecordForm.reset();
    resetAvatarPreview();
});

cancelBtn.addEventListener("click", () => {
    addRecordModal.style.display = "none";
    addRecordForm.reset();
    resetAvatarPreview();
});

addRecordModal.addEventListener("click", (e) => {
    if (e.target === addRecordModal) {
        addRecordModal.style.display = "none";
        addRecordForm.reset();
        resetAvatarPreview();
    }
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

function resetAvatarPreview() {
    avatarPreview.innerHTML = '<i class="fa-solid fa-user" style="font-size: 40px; color: #ccc;"></i>';
}

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
        avatar: avatarUrl,
        name: formData.get("name"),
        color: formData.get("color"),
        company: formData.get("company"),
        genre: formData.get("genre"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        dob: formData.get("dob"),
        timezone: formData.get("timezone"),
        music: formData.get("music"),
        city: formData.get("city"),
        state: formData.get("state"),
        address: formData.get("address"),
        street: formData.get("street"),
        building: formData.get("building"),
        zip: formData.get("zip"),
        password: formData.get("password"),
        createdAt: isEditMode ? editingUser.createdAt : new Date().toISOString()
    };

    if (isEditMode) {
        await editRecordById(editingUser.id, recordData);
    } else {
        await addNewRecordAtStart(recordData);
    }

    addRecordModal.style.display = "none";
    addRecordForm.reset();
    resetAvatarPreview();
});

function resizeImage(file, maxWidth = 80, maxHeight = 80) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                let { width, height } = img;
                if (width > maxWidth) {
                    height = height * (maxWidth / width);
                    width  = maxWidth;
                }
                if (height > maxHeight) {
                    width  = width * (maxHeight / height);
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

function renderTable(data) {
    tableBodyElement.innerHTML = "";
    cardViewElement.innerHTML  = "";
    appendNewItems(data);
}

async function editRecordById(id, updates) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method : "PUT",
            headers: { "Content-Type": "application/json" },
            body   : JSON.stringify(updates)
        });
        if (!response.ok) {
            throw new Error(`Lỗi khi sửa record id ${id}: ${response.status}`);
        }
        const updatedData = await response.json();
        console.log(`Record id ${id} đã được cập nhật:`, updatedData);
        const index = allLoadedData.findIndex(item => item.id == id);
        if (index !== -1) {
            allLoadedData[index] = updatedData;
            renderTable(allLoadedData);
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

async function loadMoreData() {
    if (!moreDataAvailable || loading) return;
    loading = true;

    if (currentPage === 1) loaderElement.style.display = "block";
    else loadMoreElement.style.display = "block";

    try {
        const response = await fetch(`${API_URL}?page=${currentPage}&limit=${itemsPerPage}&sortBy=id&order=asc`);
        const dataList = await response.json();
        if (dataList.length === 0) moreDataAvailable = false;
        else {
            allLoadedData = [...allLoadedData, ...dataList];
            appendNewItems(dataList);
            currentPage++;
            if (currentPage === 2) {
                scrollContainer.style.display = "block";
                loaderElement.style.display = "none";
            }
        }
    } catch (error) {
        console.error(error);
        moreDataAvailable = false;
    }

    if (!moreDataAvailable || allLoadedData.length >= 100) {
        loadMoreElement.style.display = "none";
        loading = false;
    } else {
        setTimeout(() => {
            loadMoreElement.style.display = "none";
            loading = false;
        }, 500);
    }
}

function appendNewItems(dataList) {
    dataList.forEach(user => {
        const tableRow = document.createElement("tr");
        tableRow.setAttribute("data-id", user.id);
        tableRow.className = "data-row";
        tableRow.style.backgroundColor = user.color || "#FFFFFF";

        const cells = [
            `<img src="${user.avatar || 'https://via.placeholder.com/40'}" alt="${user.name}" class="avatar-small">`,
            user.name || 'N/A',
            user.company || 'N/A',
            user.genre || 'N/A',
            user.email || 'N/A',
            user.phone || 'N/A',
            user.dob || 'N/A',
            user.color || 'N/A',
            user.timezone || 'N/A',
            user.music || 'N/A',
            user.city || 'N/A',
            user.state || 'N/A',
            user.address || 'N/A',
            user.street || 'N/A',
            user.building || 'N/A',
            user.zip || user.zipcode || 'N/A',
            user.createdAt || 'N/A',
            user.password || 'N/A'
        ];

        cells.forEach(content => {
            const td = document.createElement("td");
            td.innerHTML = content;
            tableRow.appendChild(td);
        });

        const actionTd = document.createElement("td");
        actionTd.innerHTML = `
            <i class="fa-solid fa-pen edit-icon" style="cursor:pointer;margin-right:8px;"></i>
            <i class="fa-solid fa-trash delete-icon" style="cursor:pointer;color:#f44336;"></i>
        `;
        tableRow.appendChild(actionTd);

        tableBodyElement.appendChild(tableRow);

        actionTd.querySelector(".delete-icon").addEventListener("click", async () => {
            if (!confirm(`Bạn chắc chắn muốn xóa record id ${user.id}?`)) return;
            try {
                const res = await fetch(`${API_URL}/${user.id}`, { method: "DELETE" });
                if (res.ok) {
                    allLoadedData = allLoadedData.filter(u => u.id != user.id);
                    tableRow.remove();
                    console.log(`Đã xóa record`);
                } else {
                    alert("Xóa thất bại!");
                }
            } catch (err) {
                console.error(err);
                alert("Lỗi khi xóa record!");
            }
        });

        actionTd.querySelector(".edit-icon").addEventListener("click", () => {
            openEditModal(user);
        });
    });
}

const submitBtn = addRecordForm.querySelector(".btn-submit");

addRecordBtn.addEventListener("click", () => {
    isEditMode = false;
    editingUser = null;
    addRecordModal.style.display = "flex";
    addRecordForm.reset();
    resetAvatarPreview();
    submitBtn.textContent = "Thêm Record";
});

function openEditModal(user) {
    isEditMode = true;
    editingUser = user;
    addRecordModal.style.display = "flex";

    addRecordForm.name.value     = user.name || "";
    addRecordForm.company.value  = user.company || "";
    addRecordForm.genre.value    = user.genre || "";
    addRecordForm.email.value    = user.email || "";
    addRecordForm.phone.value    = user.phone || "";
    addRecordForm.dob.value      = user.dob || "";
    addRecordForm.color.value    = user.color || "";
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

    submitBtn.textContent = "Chỉnh sửa";
}

closeModalBtn.addEventListener("click", () => {
    addRecordModal.style.display = "none";
    addRecordForm.reset();
    resetAvatarPreview();
    submitBtn.textContent = "Thêm Record";
});

cancelBtn.addEventListener("click", () => {
    addRecordModal.style.display = "none";
    addRecordForm.reset();
    resetAvatarPreview();
    submitBtn.textContent = "Thêm Record";
});

addRecordModal.addEventListener("click", (e) => {
    if (e.target === addRecordModal) {
        addRecordModal.style.display = "none";
        addRecordForm.reset();
        resetAvatarPreview();
        submitBtn.textContent = "Thêm Record";
    }
});

scrollContainer.addEventListener("scroll", () => {
    const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
    if (scrollTop + clientHeight >= scrollHeight - 1) {
        if (moreDataAvailable) {
            loadMoreElement.style.display = "block";
            loadMoreElement.querySelector('div:last-child').textContent = `...`;
            loadMoreData();
        } else {
            loadMoreElement.style.display = "none";
        }
    }
});

window.addEventListener('resize', () => {
    switchViewMode();
});

if (fakeScrollBar) {
    fakeScrollBar.addEventListener('scroll', () => {
        scrollContainer.scrollLeft = fakeScrollBar.scrollLeft;
    });
    
    scrollContainer.addEventListener('scroll', () => {
        if (!checkMobileView()) fakeScrollBar.scrollLeft = scrollContainer.scrollLeft;
    });
}

switchViewMode();
loadMoreData();
