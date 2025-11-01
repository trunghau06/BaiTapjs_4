class ResponsiveVirtualView {
    constructor() {
        this.data = []; // Mang luu tru toan bo du lieu da tai
        this.cardsPerRow = 1; // Luon la 1 hang/row cho virtual scrolling doc
        this.visibleRows = 0; // So luong hang nhin thay trong viewport
        this.bufferRows = 5; // Vung dem can thiet de cuon muot
        this.startIndex = 0; // Chi muc bat dau cua data
        this.endIndex = 0; // Chi muc ket thuc cua data
        this.isLoading = false; // Co kiem soat trang thai tai du lieu
        this.hasMore = true; // Kiem tra con du lieu de tai tiep khong
        this.currentPage = 1; // Trang API hien tai
        this.rowHeight = 0; // Chieu cao cua mot hang/card
        
        this.renderedCardIds = new Set(); // Set luu tru ID cac the hien dang co trong DOM

        this.cardsContainer = document.getElementById('cardsContainer'); // The chua cuon doc chinh
        this.cardsSpacer = document.getElementById('cardsSpacer'); // The tao chieu cao ao
        this.cardsContent = document.getElementById('cardsContent'); // The noi dung tao offset
        
        // CÁC CONTAINER DOM DẠNG TABLE VÀ CARD
        this.tableBody = document.getElementById('tableBody'); // Body cua Table
        this.tableView = document.getElementById('tableView'); // Khung bọc Table
        this.cardView = document.getElementById('cardView'); // Khung bọc Card
        
        this.loader = document.getElementById('loader'); // Spinner tai ban dau
        this.loadingMore = document.getElementById('loadingMore'); // Spinner tai them

        // KHAI BÁO CÁC BIẾN CUỘN NGANG GIẢ
        this.table = document.querySelector('.data-table'); // Lay Table that
        this.fakeScroll = document.getElementById('fakeScroll'); // Thanh scroll nho ben trong wrapper
        this.fakeWrapper = document.querySelector('.fake-scroll-wrapper'); // Thanh scroll gia (wrapper)
        
        this.init(); // Khoi tao chuong trinh
    }
    
    // Thuoc tinh tinh toan che do xem (breakpoint 768px)
    get isMobileView() {
        return window.innerWidth <= 768; // True neu man hinh nho hon hoac bang 768px
    }

    async init() {
        await this.loadInitialData(); // Tai data ban dau 100 records
        this.cardsContainer.style.display = 'block'; // Hien thi khung cuon
        
        window.requestAnimationFrame(() => { // Doi trinh duyet san sang de do dac DOM
            this.updateViewMode(); // Cap nhat che do xem
            
            this.createTemporaryElement(); // Tao phan tu tam de do kich thuoc
            this.calculateLayout(); // Tinh toan chieu cao row/card
            this.removeTemporaryElement(); // Xoa phan tu tam

            this.setupScrollListener(); // Cai dat lang nghe cuon doc
            this.setupResizeListener(); // Cai dat lang nghe thay doi kich thuoc man hinh
            this.setupHorizontalSync(); // Thiet lap dong bo cuon ngang gia
            this.render(); // Bat dau render ao
            this.loader.style.display = 'none'; // An loader khoi tao
        });
    }

    async loadInitialData() {
        const promises = []; // Mang luu tru cac promise
        for (let page = 1; page <= 5; page++) { // Lap 5 lan de lay 100 records
            promises.push(
                fetch(`https://671891927fc4c5ff8f49fcac.mockapi.io/v2?page=${page}&limit=20`)
                    .then(res => res.json())
            );
        }

        try {
            const results = await Promise.all(promises); // Doi tat ca promise
            this.data = results.flat(); // Gop du lieu
            this.data.sort((a, b) => Number(a.id) - Number(b.id)); // Sap xep theo ID
            this.currentPage = 6; // Dat trang tiep theo can tai
        } catch (error) {
            console.error("Error loading initial data:", error);
        }
    }

    async loadData() {
        if (this.isLoading || !this.hasMore) return; // Kiem tra co the tai them khong
        this.isLoading = true;
        this.loadingMore.style.display = "block"; // Hien thi loading

        try {
            const response = await fetch( // Goi API tai trang tiep theo
                `https://671891927fc4c5ff8f49fcac.mockapi.io/v2?page=${this.currentPage}&limit=20`
            );
            const newData = await response.json();

            if (newData.length === 0) {
                this.hasMore = false; // Het data
            } else {
                this.data = [...this.data, ...newData]; // Them data vao mang
                this.data.sort((a, b) => Number(a.id) - Number(b.id)); // Sap xep
                this.currentPage++;
                this.render(); // Render lai
            }
        } catch (error) {
            console.error("Error loading more data:", error);
        }

        this.isLoading = false;
        this.loadingMore.style.display = 'none'; // An loading
    }

    updateViewMode() {
        // Ham nay duoc goi de cap nhat che do xem khi resize
    }
    
    createTemporaryElement() {
        const targetContainer = this.isMobileView ? this.cardView : this.tableBody; // Chon container dua tren mode
        const className = this.isMobileView ? '.card' : '.data-row'; // Chon class name

        if (this.data.length > 0 && !targetContainer.querySelector(className)) { // Neu chua co phan tu nao
            const sampleElement = this.isMobileView 
                ? this.createCardElement(this.data[0]) // Tao card neu mobile
                : this.createRowElement(this.data[0]); // Tao row neu desktop
            
            sampleElement.style.visibility = 'hidden'; // An de khong anh huong layout
            sampleElement.id = 'temp-el-for-measurement';
            targetContainer.appendChild(sampleElement); // Chen vao DOM de do dac
        }
    }

    removeTemporaryElement() {
        const tempElement = document.getElementById('temp-el-for-measurement'); // Tim phan tu tam
        if (tempElement) {
            tempElement.parentElement.removeChild(tempElement); // Xoa
        }
    }

    calculateLayout() {
        const targetContainer = this.isMobileView ? this.cardView : this.tableBody; // Chon container
        const className = this.isMobileView ? '.card' : '.data-row';
        const gap = this.isMobileView ? 15 : 0; // Lay gap tuy theo mode

        this.cardsPerRow = 1; // Luon la 1 row/hang
        
        const firstElement = targetContainer.querySelector(className); // Lay phan tu mau
        
        if (firstElement) {
            const rect = firstElement.getBoundingClientRect();
            this.rowHeight = rect.height + gap; // Tinh chieu cao phan tu + gap
        } else {
            this.rowHeight = this.isMobileView ? 250 : 80; // Chieu cao mac dinh
        }

        if (this.rowHeight > 0) {
            const containerHeight = this.cardsContainer.clientHeight; // Chieu cao viewport
            this.visibleRows = Math.ceil(containerHeight / this.rowHeight) + 1; // Tinh so hang hien thi
        } else {
            this.visibleRows = 10; 
            this.rowHeight = 80;
        }
    }

    setupScrollListener() {
        let scrollTimeout;
        this.cardsContainer.addEventListener('scroll', () => { // Lang nghe cuon doc tren cardsContainer
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.render(); // Render lai
                this.checkLoadMore(); // Kiem tra tai them
            }, 16);
        });
    }

    setupResizeListener() {
        let resizeTimeout;
        window.addEventListener('resize', () => { // Lang nghe resize
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.updateViewMode(); // Cap nhat mode
                this.createTemporaryElement();
                this.calculateLayout(); // Tinh toan lai layout
                this.removeTemporaryElement(); 
                this.render();
            }, 300);
        });
    }

    checkLoadMore() {
        const scrollTop = this.cardsContainer.scrollTop; // Vi tri cuon doc
        const scrollHeight = this.cardsContainer.scrollHeight;
        const clientHeight = this.cardsContainer.clientHeight;
        const scrollPercentage = (scrollTop + clientHeight) / scrollHeight; // Phan tram cuon

        if (scrollPercentage > 0.8 && !this.isLoading && this.hasMore) { // Neu gan cuoi va co the tai
            this.loadData(); // Tai data
        }
    }

    setupHorizontalSync() {
        // Kiem tra xem cac phan tu cuon gia co ton tai khong
        if (!this.fakeScroll || !this.fakeWrapper || !this.table) return;

        // Set width fake scroll bang minWidth cua bang (CSS)
        const tableMinWidth = window.getComputedStyle(this.table).minWidth; // Lay minWidth tu CSS
        this.fakeScroll.style.minWidth = tableMinWidth; 

        // Khi scroll thanh gia cuon cards container
        this.fakeWrapper.addEventListener('scroll', () => {
            this.cardsContainer.scrollLeft = this.fakeWrapper.scrollLeft; // Dong bo vi tri cuon
        });

        // Khi cuon bang cap nhat fake scroll
        this.cardsContainer.addEventListener('scroll', () => {
            // Chi dong bo cuon ngang khi dang o che do Table
            if (!this.isMobileView) {
                this.fakeWrapper.scrollLeft = this.cardsContainer.scrollLeft; // Dong bo vi tri cuon
            }
        });
        
        // An/Hien thanh cuon gia
        this.fakeWrapper.style.display = this.isMobileView ? 'none' : 'block'; // An di neu mobile
    }


    // --- LOGIC RENDER ĐA NĂNG ---

    render() {
        this.updateViewMode(); // Cap nhat mode truoc khi render
        
        if (this.data.length === 0 || this.rowHeight === 0) { // Tinh toan lai neu bi loi
            this.createTemporaryElement();
            this.calculateLayout();
            this.removeTemporaryElement();
            if (this.rowHeight === 0) return;
        }

        const scrollTop = this.cardsContainer.scrollTop; // Vi tri cuon
        const startRow = Math.floor(scrollTop / this.rowHeight); // Hang bat dau
        
        const adjustedStartRow = Math.max(0, startRow - this.bufferRows); // Hang bat dau co buffer
        this.startIndex = adjustedStartRow; // Chi muc bat dau
        
        const totalRowsToRender = this.visibleRows + 2 * this.bufferRows; // Tong so hang can render
        const targetEndRow = adjustedStartRow + totalRowsToRender; 
        this.endIndex = Math.min(this.data.length, targetEndRow); // Chi muc ket thuc
        
        const totalRows = this.data.length; // Tong so hang data
        const totalHeight = totalRows * this.rowHeight; // Tong chieu cao ao
        this.cardsSpacer.style.height = totalHeight + 'px'; // Gan chieu cao ao

        const offsetY = adjustedStartRow * this.rowHeight; // Tinh offset de day noi dung xuong
        this.cardsContent.style.paddingTop = offsetY + 'px'; // Gan offset

        this.renderVisibleElements(); // Render phan tu thuc te
    }

    renderVisibleElements() {
        const targetContainer = this.isMobileView ? this.cardView : this.tableBody; // Chon container dich
        const viewToShow = this.isMobileView ? this.cardView : this.tableView; // Khung can hien thi
        const viewToHide = this.isMobileView ? this.tableView : this.cardView; // Khung can an
        
        // Hien thi/An dung container
        viewToShow.style.display = 'block';
        viewToHide.style.display = 'none';
        
        // An/Hien thanh cuon gia
        if (this.fakeWrapper) {
             this.fakeWrapper.style.display = this.isMobileView ? 'none' : 'block'; // An neu mobile
        }

        const visibleData = this.data.slice(this.startIndex, this.endIndex); // Lat cat du lieu
        const newVisibleIds = new Set(visibleData.map(item => Number(item.id))); // ID can co

        const fragment = document.createDocumentFragment(); // Fragment de thao tac DOM
        
        // Xoa cac phan tu cu (DOM Reconciliation)
        let nodesToRemove = [];
        Array.from(targetContainer.children).forEach(node => {
            const nodeId = Number(node.dataset.id); 
            if (!newVisibleIds.has(nodeId)) {
                nodesToRemove.push(node); // Danh dau xoa
                this.renderedCardIds.delete(nodeId);
            }
        });
        
        nodesToRemove.forEach(node => targetContainer.removeChild(node)); // Thuc hien xoa
        
        // Them/Cap nhat cac phan tu moi
        visibleData.forEach(item => {
            let element = targetContainer.querySelector(`[data-id="${item.id}"]`); // Tim phan tu cu
            
            if (!element) {
                element = this.isMobileView ? this.createCardElement(item) : this.createRowElement(item); // Tao moi
                this.renderedCardIds.add(Number(item.id)); 
            }
            fragment.appendChild(element); // Them vao fragment
        });

        targetContainer.appendChild(fragment); // Cap nhat DOM chinh
    }

    // --- HTML GENERATORS: ROW (TABLE) ---

    createRowElement(item) {
        const tempTBody = document.createElement('tbody'); // Tao tbody tam de chua tr
        tempTBody.innerHTML = String(this.createRowHTML(item)).trim(); // Gan HTML

        if (!tempTBody.firstChild || tempTBody.firstChild.nodeName !== 'TR') { // Kiem tra hop le
            return document.createElement('tr'); 
        }

        const rowElement = tempTBody.firstChild; // Lay the tr
        rowElement.setAttribute('data-id', item.id); // Gan ID
        return rowElement;
    }
    
    createRowHTML(item) {
        const isMale = item.genre?.toLowerCase() === 'male';
        const badgeClass = isMale ? 'badge-male' : 'badge-female';
        const badgeText = isMale ? 'Nam' : 'Nữ';
        const badgeIcon = isMale ? 'fa-mars' : 'fa-venus';

        return `
            <tr class="data-row" data-id="${item.id}">
                <td>${item.id || 'N/A'}</td>
                <td><img src="${item.avatar}" alt="${item.name}" class="avatar-small" loading="lazy"></td>
                <td>${item.name || 'N/A'}</td>
                <td>${item.company || 'N/A'}</td>
                <td>
                    <span class="card-badge ${badgeClass}">
                        <i class="fa-solid ${badgeIcon}"></i> ${badgeText}
                    </span>
                </td>
                <td>${item.email || 'N/A'}</td>
                <td>${item.phone || 'N/A'}</td>
                
                <td>${item.dob || 'N/A'}</td>
                <td><span style="color:${item.color || '#000'}; font-weight: 700;">${item.color || 'N/A'}</span></td>
                <td>${item.timezone || 'N/A'}</td>
                <td>${item.music || 'N/A'}</td>
                <td>${item.city || 'N/A'}</td>
                <td>${item.state || 'N/A'}</td>
                
                <td>${item.address || 'N/A'}</td>
                <td>${item.street || 'N/A'}</td>
                <td>${item.building || 'N/A'}</td>
                <td>${item.zip || item.zipcode || 'N/A'}</td>
                <td>${item.createdAt || 'N/A'}</td>
                <td>${item.password || 'N/A'}</td>
            </tr>
        `;
    }
    
    // --- HTML GENERATORS: CARD (MOBILE) ---
    
    createCardElement(item) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = String(this.createCardHTML(item)).trim();

        if (!tempDiv.firstChild) {
            return document.createElement('div'); 
        }

        const cardElement = tempDiv.firstChild;
        cardElement.setAttribute('data-id', item.id); 
        return cardElement;
    }
    
    createCardHTML(item) {
        const isMale = item.genre?.toLowerCase() === 'male';
        const genderText = isMale ? 'Nam' : 'Nữ';
        const colorValue = item.color || '#000';

        return `
            <div class="card" data-id="${item.id}">
                <div class="card-header">
                    <img src="${item.avatar}" alt="${item.name}" class="avatar" loading="lazy">
                    <div class="card-info">
                        <div class="card-name">${item.name || 'N/A'}</div>
                        <div class="card-company">${item.company || 'N/A'}</div>
                    </div>
                    <span class="card-badge ${isMale ? 'badge-male' : 'badge-female'}">
                         ${genderText}
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
                    <div class="card-item"><i class="fa-solid fa-palette card-icon"></i> <strong>Color:</strong> <span style="color:${colorValue};">${colorValue}</span></div>
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

new ResponsiveVirtualView();