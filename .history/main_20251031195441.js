class VirtualCards {
    constructor() {
        this.data        = []; //* mang luu tru toan bo du lieu
        this.cardsPerRow = 0; //* So luong card tren mot hang 
        this.visibleRows = 0; //* So luong hang nhin thay
        this.bufferRows  = 0;
        this.startIndex  = 0; 
        this.endIndex    = 0; 
        this.isLoading   = false;
        this.hasMore     = true; 
        this.currentPage  = 1; 
        this.cardHeight  = 0; 
        
        this.renderedCardIds = new Set();

        this.cardsContainer = document.getElementById('cardsContainer');
        this.cardsSpacer = document.getElementById('cardsSpacer');
        this.cardsContent = document.getElementById('cardsContent'); 
        this.cardsGrid = document.getElementById('cardsGrid'); 
        this.loader = document.getElementById('loader'); 
        this.loadingMore = document.getElementById('loadingMore');

        this.init(); 
    }

    async init() {
        await this.loadInitialData(); 
        this.cardsContainer.style.display = 'block'; 

        this.createTemporaryCard(); // Tao mot card tam thoi de do kich thuoc
        this.calculateLayout(); // Tinh toan chieu cao card va so hang hien thi
        this.removeTemporaryCard(); // Xoa card tam thoi

        if (this.cardsPerRow > 0) { 
            this.visibleRows = Math.ceil(8 / this.cardsPerRow); 
            this.bufferRows = 0;
        }
        
        this.setupScrollListener(); 
        this.setupResizeListener();
        this.render(); 
        this.loader.style.display = 'none'; 
    }

    async loadInitialData() {
        const promises = []; // Mang luu tru cac promise
        for (let page = 1; page <= 5; page++) { 
            promises.push(
                fetch(`https://671891927fc4c5ff8f49fcac.mockapi.io/v2?page=${page}&limit=20`)
                    .then(res => res.json()) // Chuyen doi response sang json
            );
        }
        try {
            const results = await Promise.all(promises); 
            this.data = results.flat(); 
            this.data.sort((a, b) => Number(a.id) - Number(b.id)); // sap xep theo id
            this.currentPage = 6; 
        } catch (error) {
            console.error("Error loading initial data:", error);
        }
    }

    async loadData() {
        if (this.isLoading || !this.hasMore) return; 
        this.isLoading = true; 
        this.loadingMore.style.display = "block"; 

        try {
            const response = await fetch(`https://671891927fc4c5ff8f49fcac.mockapi.io/v2?page=${this.currentPage}&limit=20`);
            const newData = await response.json(); 

            if (newData.length === 0) { 
                this.hasMore = false; 
            } else {
                this.data = [...this.data, ...newData]; // Them data moi vao mang
                this.data.sort((a, b) => Number(a.id) - Number(b.id));
                this.currentPage++; 
                this.render();
            }
        } catch (error) {
            console.error("Error loading more data:", error); 
        }

        this.isLoading = false; 
        this.loadingMore.style.display = 'none';
    }
    
    createTemporaryCard() {
        if (this.data.length > 0 && !this.cardsGrid.querySelector('.card')) {
             const sampleCard = this.createCardElement(this.data[0]); 
             sampleCard.style.visibility = 'hidden'; 
             sampleCard.id = 'temp-card-for-measurement'; 
             this.cardsGrid.appendChild(sampleCard); 
        }
    }

    removeTemporaryCard() {
        const tempCard = this.cardsGrid.querySelector('#temp-card-for-measurement'); // Tim card tam
        if (tempCard) {
            this.cardsGrid.removeChild(tempCard); // Xoa khoi DOM
        }
    }

    calculateLayout() {
        const gap = 30; // Khoang cach giua cac card gap
        const containerWidth = this.cardsGrid.offsetWidth; // Chieu rong cua luoi hien tai
        const cardMinWidth = 320; // Chieu rong toi thieu cua card theo CSS
        
        // Tinh cardsPerRow dua tren Responsive Grid CSS
        this.cardsPerRow = Math.max(1, Math.floor((containerWidth + gap) / (cardMinWidth + gap))); // Tinh so luong card tren mot hang
        
        const firstCard = this.cardsGrid.querySelector('.card'); // Lay card dau tien co the la card tam
        if (firstCard) {
            const rect = firstCard.getBoundingClientRect(); // Lay kich thuoc thuc te
            this.cardHeight = rect.height + gap; // Tinh chieu cao card card height + gap
        } else {
            this.cardHeight = 450; // Gia tri mac dinh neu khong do duoc
        }
        
        // KHÔNG tính this.visibleRows ở đây nữa vì đã thiết lập ở init
    }

    setupScrollListener() {
        let scrollTimeout; // Bien timeout de debounce scroll
        this.cardsContainer.addEventListener('scroll', () => { // Lang nghe su kien scroll tren container
            clearTimeout(scrollTimeout); // Xoa timeout truoc
            scrollTimeout = setTimeout(() => { // Dat timeout moi debounce
                this.render(); // Goi render de cap nhat view
                this.checkLoadMore(); // Kiem tra xem co can tai them khong
            }, 16); // Khoang thoi gian debounce
        });
    }

    setupResizeListener() {
        let resizeTimeout; // Bien timeout de debounce resize
        window.addEventListener('resize', () => { // Lang nghe su kien resize cua cua so
            clearTimeout(resizeTimeout); // Xoa timeout truoc
            resizeTimeout = setTimeout(() => { // Dat timeout moi
                this.createTemporaryCard(); // Tao lai card tam thoi neu can
                this.calculateLayout(); // Tinh toan lai layout
                this.removeTemporaryCard(); // Xoa card tam thoi
                
                // Cập nhật lại visibleRows và buffer khi resize
                if (this.cardHeight > 0) {
                   const containerHeight = this.cardsContainer.clientHeight;
                   this.visibleRows = Math.ceil(containerHeight / this.cardHeight) + 1; // Tinh lai visibleRows thuc te
                   this.bufferRows = 2; // Bat buffer lai
                }
                
                this.render(); // Render lai
            }, 300); // Khoang thoi gian debounce
        });
    }

    checkLoadMore() {
        const scrollTop = this.cardsContainer.scrollTop; // Vi tri cuon hien tai
        const scrollHeight = this.cardsContainer.scrollHeight; // Tong chieu cao noi dung
        const clientHeight = this.cardsContainer.clientHeight; // Chieu cao cua viewport
        const scrollPercentage = (scrollTop + clientHeight) / scrollHeight; // Phan tram da cuon

        if (scrollPercentage > 0.8 && !this.isLoading && this.hasMore) { // Neu cuon gan cuoi 80% va khong dang tai
            this.loadData(); // Goi ham tai them du lieu
        }
    }

    render() {
        if (this.data.length === 0 || this.cardHeight === 0 || this.cardsPerRow === 0) { // Kiem tra neu layout chua san sang
            this.createTemporaryCard(); // Tao card tam de do
            this.calculateLayout(); // Tinh toan layout
            this.removeTemporaryCard(); // Xoa card tam
            
            // THIẾT LẬP LẠI VÀ CHỈNH BUFFER LẦN CUỐI NẾU KHỞI TẠO BỊ LỖI
            if (this.cardsPerRow > 0) {
                 this.visibleRows = Math.ceil(8 / this.cardsPerRow); 
                 this.bufferRows = 0;
            }
            if (this.cardHeight === 0 || this.cardsPerRow === 0) return; // Thoat neu van chua tinh duoc
        }

        const scrollTop = this.cardsContainer.scrollTop; // Vi tri cuon hien tai
        const startRow = Math.floor(scrollTop / this.cardHeight); // Tinh hang bat dau

        // XỬ LÝ CHUYỂN ĐỔI: Nếu người dùng đã cuộn, bật Virtual Scrolling đầy đủ
        let currentVisibleRows = this.visibleRows; // Luu tru visibleRows ban dau
        let currentBufferRows = this.bufferRows; // Luu tru bufferRows ban dau (0)

        if (scrollTop > 0) { // Nếu đã cuộn
            currentBufferRows = 2; // Bật buffer lên 2
            // Tinh lai so hang hien thi thuc te (bao gom buffer)
            currentVisibleRows = Math.ceil(this.cardsContainer.clientHeight / this.cardHeight) + 1;
        }

        // Tinh startIndex va offset co buffer (trừ)
        const adjustedStartRow = Math.max(0, startRow - currentBufferRows); // Hang bat dau co tru buffer
        this.startIndex = adjustedStartRow * this.cardsPerRow; // Chi muc data bat dau
        
        // Tinh endIndex (visible + 2*buffer)
        const totalRowsToRender = currentVisibleRows + 2 * currentBufferRows; // Tong so hang can render
        const targetEndRow = adjustedStartRow + totalRowsToRender; // Hang ket thuc
        this.endIndex = Math.min(this.data.length, targetEndRow * this.cardsPerRow); // Chi muc data ket thuc
        
        // Tinh tong height cho spacer (chieu cao ao)
        const totalRows = Math.ceil(this.data.length / this.cardsPerRow); // Tong so hang thuc te + ao
        const totalHeight = totalRows * this.cardHeight; // Tong chieu cao ao
        this.cardsSpacer.style.height = totalHeight + 'px'; // Gan chieu cao cho spacer

        // Set padding-top de tao offset
        const offsetY = adjustedStartRow * this.cardHeight; // Tinh offset de day noi dung xuong
        this.cardsContent.style.paddingTop = offsetY + 'px'; // Gan padding-top cho the noi dung

        this.renderVisibleCards(); // Goi ham render cac card thuc te
    }

    /**
     * DOM Reconciliation (chi them/xoa/sap xep lai)
     */
    renderVisibleCards() {
        const visibleData = this.data.slice(this.startIndex, this.endIndex); // Lay lat cat du lieu can render
        const newVisibleIds = new Set(visibleData.map(item => Number(item.id))); // Tap hop ID cua card moi

        const fragment = document.createDocumentFragment(); // Tao fragment de thao tac DOM hieu nang cao
        
        // 1. XOA CAC CARD CU
        let nodesToRemove = []; // Mang luu tru cac the can xoa
        Array.from(this.cardsGrid.children).forEach(node => { // Lap qua cac the con hien tai
            const nodeId = Number(node.dataset.id); // Lay ID cua the
            if (!newVisibleIds.has(nodeId)) { // Neu ID khong nam trong tap hop card moi
                nodesToRemove.push(node); // Them vao danh sach xoa
                this.renderedCardIds.delete(nodeId); // Xoa ID khoi danh sach da render
            }
        });
        
        nodesToRemove.forEach(node => this.cardsGrid.removeChild(node)); // Thuc hien xoa khoi DOM
        
        // 2. THEM/SẮP XẾP LẠI CARD
        visibleData.forEach(item => { // Lap qua du lieu can hien thi
            const itemId = Number(item.id);
            let cardElement = this.cardsGrid.querySelector(`[data-id="${item.id}"]`); // Tim kiem the da co trong DOM
            
            if (!cardElement) { // Neu the chua ton tai
                cardElement = this.createCardElement(item); // Tao the card moi
                this.renderedCardIds.add(itemId); // Them ID vao danh sach da render
            }
            fragment.appendChild(cardElement); // Them the vao fragment
        });

        this.cardsGrid.appendChild(fragment); // Chen fragment vao DOM chinh thuc hien cap nhat 1 lan
    }

    createCardElement(item) {
        const tempDiv = document.createElement('div'); // Tao the div tam thoi
        tempDiv.innerHTML = this.createCardHTML(item).trim(); // Gan HTML vao the tam va xoa khoang trang thua
        tempDiv.firstChild.setAttribute('data-id', item.id); // Gan data-id vao the card the con dau tien
        return tempDiv.firstChild; // Tra ve the card div.card
    }
    
    // Tao chuoi HTML cho mot card
    createCardHTML(item) {
        const isMale = item.genre?.toLowerCase() === 'male'; // Kiem tra gioi tinh
        const colorValue = item.color || '#000'; // Mau mac dinh

        return `
            <div class="card" data-id="${item.id}">
                <div class="card-header">
                    <img src="${item.avatar}" alt="${item.name}" class="avatar" loading="lazy">
                    <div class="card-info">
                        <div class="card-name">${item.name || 'N/A'}</div>
                        <div class="card-company">${item.company || 'N/A'}</div>
                    </div>
                    <span class="card-badge ${isMale ? 'badge-male' : 'badge-female'}">
                        <i class="fa-solid ${isMale ? 'fa-mars' : 'fa-venus'}"></i>
                        ${isMale ? 'Nam' : 'Nu'}
                    </span>
                </div>
                <div class="card-body">
                    <div class="card-item"><i class="fa-solid fa-id-badge card-icon"></i> <strong>ID:</strong> ${item.id || 'N/A'}</div>
                    <div class="card-item"><i class="fa-regular fa-calendar-plus card-icon"></i> <strong>Created At:</strong> ${item.createdAt || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-user card-icon"></i> <strong>Name:</strong> ${item.name || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-venus-mars card-icon"></i> <strong>Genre:</strong> ${item.genre || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-building card-icon"></i> <strong>Company:</strong> ${item.company || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-calendar-days card-icon"></i> <strong>DOB:</strong> ${item.dob || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-clock card-icon"></i> <strong>Timezone:</strong> ${item.timezone || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-palette card-icon"></i> <strong>Color:</strong> <span class="color-text" style="color:${colorValue};">${colorValue}</span></div>
                    <div class="card-item"><i class="fa-solid fa-music card-icon"></i> <strong>Music:</strong> ${item.music || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-map-location-dot card-icon"></i> <strong>Address:</strong> ${item.address || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-city card-icon"></i> <strong>City:</strong> ${item.city || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-map card-icon"></i> <strong>State:</strong> ${item.state || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-road card-icon"></i> <strong>Street:</strong> ${item.street || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-building-columns card-icon"></i> <strong>Building:</strong> ${item.building || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-hashtag card-icon"></i> <strong>ZIP:</strong> ${item.zip || item.zipcode || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-envelope card-icon"></i> <strong>Email:</strong> ${item.email || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-phone card-icon"></i> <strong>Phone:</strong> ${item.phone || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-lock card-icon"></i> <strong>Password:</strong> ${item.password || 'N/A'}</div>
                </div>
            </div>
        `;
    }
}

new VirtualCards();