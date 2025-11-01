class VirtualCards {
    constructor() {
        this.data = [];
        this.cardsPerRow = 0;
        this.visibleRows = 0;
        this.bufferRows = 2; 
        this.startIndex = 0;
        this.endIndex = 0;
        this.isLoading = false;
        this.hasMore = true;
        this.currentPage = 1;
        this.cardHeight = 0;
        
        // BỘ NHỚ ĐỆM: Theo dõi ID của các card đang được render trong DOM
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
        
        // ✅ THAY ĐỔI: InitialRender được gọi trước để có card DOM 
        // Sau đó nó gọi calculateLayout để lấy kích thước chính xác
        this.initialRender(); 
        
        this.setupScrollListener();
        this.setupResizeListener();
        this.render(); 
        this.loader.style.display = 'none';
    }

    async loadInitialData() {
        const promises = [];
        for (let page = 1; page <= 5; page++) {
            promises.push(
                fetch(`https://671891927fc4c5ff8f49fcac.mockapi.io/v2?page=${page}&limit=20`)
                    .then(res => res.json())
            );
        }

        try {
            const results = await Promise.all(promises);
            this.data = results.flat();
            this.currentPage = 6;
            console.log(`✅ Loaded ${this.data.length} records initially`);
        } catch (error) {
            console.error("Error loading initial data:", error);
        }
    }

    async loadData() {
        if (this.isLoading || !this.hasMore) return;

        this.isLoading = true;
        this.loadingMore.style.display = "block";

        try {
            const response = await fetch(
                `https://671891927fc4c5ff8f49fcac.mockapi.io/v2?page=${this.currentPage}&limit=20`
            );
            const newData = await response.json();

            if (newData.length === 0) {
                this.hasMore = false;
            } else {
                this.data = [...this.data, ...newData];
                this.currentPage++;
                this.render(); 
                console.log(`📦 Loaded more data. Total: ${this.data.length}`);
            }
        } catch (error) {
            console.error("Error loading more data:", error);
        }

        this.isLoading = false;
        this.loadingMore.style.display = 'none';
    }

    initialRender() {
        // Render 10 card ban đầu
        const initialCards = this.data.slice(0, 10); 
        this.cardsGrid.innerHTML = initialCards.map(item => this.createCardHTML(item)).join('');
        
        this.renderedCardIds.clear(); 
        initialCards.forEach(item => this.renderedCardIds.add(item.id));
        
        // Gọi calculateLayout ngay tại đây để có cardsPerRow và cardHeight chính xác
        this.calculateLayout();
    }

    calculateLayout() {
        const gap = 30;

        // ✅ Lấy cardsPerRow từ Grid CSS thực tế
        const computedStyle = window.getComputedStyle(this.cardsGrid);
        const gridTemplateColumns = computedStyle.getPropertyValue('grid-template-columns');
        
        this.cardsPerRow = gridTemplateColumns.split(' ').filter(c => c !== ' ' && c.toLowerCase().includes('fr')).length;
        
        if (this.cardsPerRow === 0) {
             this.cardsPerRow = 1;
        }

        const firstCard = this.cardsGrid.querySelector('.card');
        if (firstCard) {
            const style = window.getComputedStyle(firstCard);
            const marginBottom = parseInt(style.marginBottom) || gap;
            this.cardHeight = firstCard.offsetHeight + marginBottom;
        } else if (this.cardHeight === 0) {
            this.cardHeight = 450; 
        }

        // Đảm bảo cardHeight > 0 trước khi chia
        if (this.cardHeight > 0) {
            const containerHeight = this.cardsContainer.clientHeight;
            this.visibleRows = Math.ceil(containerHeight / this.cardHeight) + 1;
        } else {
             this.visibleRows = 5; 
        }

        console.log(`📐 Layout: ${this.cardsPerRow} cards/row, ${this.cardHeight}px height`);
    }

    setupScrollListener() {
        let scrollTimeout;
        this.cardsContainer.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.render();
                this.checkLoadMore();
            }, 16);
        });
    }

    setupResizeListener() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.renderedCardIds.clear(); 
                this.cardsGrid.innerHTML = '';
                this.initialRender(); // Initial render and layout calculation
                this.render();
            }, 300);
        });
    }

    checkLoadMore() {
        const scrollTop = this.cardsContainer.scrollTop;
        const scrollHeight = this.cardsContainer.scrollHeight;
        const clientHeight = this.cardsContainer.clientHeight;
        const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

        if (scrollPercentage > 0.8 && !this.isLoading && this.hasMore) {
            this.loadData();
        }
    }

    render() 
    {
        if (this.data.length === 0) return;

        // Cập nhật lại layout (đảm bảo cardsPerRow chính xác)
        this.calculateLayout(); 

        const scrollTop = this.cardsContainer.scrollTop;
        
        // Row đang cuộn qua (đã ở phía trên viewport)
        const startRow = Math.floor(scrollTop / this.cardHeight);
        
        // Tính start index có buffer (trừ)
        const adjustedStartRow = Math.max(0, startRow - this.bufferRows); 
        this.startIndex = adjustedStartRow * this.cardsPerRow;
        
        // Tổng số hàng cần render (visible + buffer trên + buffer dưới)
        const totalRowsToRender = this.visibleRows + 2 * this.bufferRows; 
        const targetEndRow = adjustedStartRow + totalRowsToRender; 

        // endIndex là index của phần tử ĐẦU TIÊN KHÔNG CẦN RENDER.
        this.endIndex = Math.min(this.data.length, targetEndRow * this.cardsPerRow); 
        
        // Tính tổng height để spacer
        const totalRows = Math.ceil(this.data.length / this.cardsPerRow);
        const totalHeight = totalRows * this.cardHeight;
        this.cardsSpacer.style.height = totalHeight + 'px';

        // Dùng adjustedStartRow để tính offset chính xác
        const offsetY = adjustedStartRow * this.cardHeight; 
        this.cardsContent.style.paddingTop = offsetY + 'px';

        this.renderVisibleCards();
    }


    /**
     * DOM Reconciliation (chỉ thêm/xóa/sắp xếp lại)
     */
    renderVisibleCards() {
        const visibleData = this.data.slice(this.startIndex, this.endIndex);
        const newVisibleIds = new Set(visibleData.map(item => item.id));

        const fragment = document.createDocumentFragment();
        let currentNodes = Array.from(this.cardsGrid.children);
        
        // 1. XÓA CÁC CARD CŨ (đã ra khỏi vùng đệm)
        for (let i = currentNodes.length - 1; i >= 0; i--) {
            const node = currentNodes[i];
            const nodeId = node.dataset.id;
            
            if (!newVisibleIds.has(nodeId)) {
                this.cardsGrid.removeChild(node);
                this.renderedCardIds.delete(nodeId);
                currentNodes.splice(i, 1);
            }
        }
        
        // 2. THÊM/SẮP XẾP LẠI CARD
        visibleData.forEach(item => {
            const itemId = item.id;
            let cardElement = null;

            if (this.renderedCardIds.has(itemId)) {
                // Card đã tồn tại (GIỮ LẠI) - Tìm và move sang fragment
                const existingIndex = currentNodes.findIndex(node => node.dataset.id === itemId);
                cardElement = currentNodes[existingIndex];
                
                if (cardElement) {
                    fragment.appendChild(cardElement);
                }
            } else {
                // Card chưa tồn tại (THÊM MỚI)
                cardElement = this.createCardElement(item);
                fragment.appendChild(cardElement);
                this.renderedCardIds.add(itemId); 
            }
        });

        // 3. CHÈN FRAGMENT
        this.cardsGrid.appendChild(fragment);

        console.log(`🎨 Rendered ${this.cardsGrid.children.length} cards (index ${this.startIndex}-${this.endIndex})`);
    }

    createCardElement(item) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = this.createCardHTML(item).trim();
        tempDiv.firstChild.setAttribute('data-id', item.id); 
        return tempDiv.firstChild;
    }

    createCardHTML(item) {
        const isMale = item.genre?.toLowerCase() === 'male';
        const colorValue = item.color || '#000';

        return `
            <div class="card" data-id="${item.id}">
                <span class="card-id">#${item.id}</span>
                <div class="card-header">
                    <img src="${item.avatar}" alt="${item.name}" class="avatar" loading="lazy">
                    <div class="card-info">
                        <div class="card-name">${item.name || 'N/A'}</div>
                        <div class="card-company">${item.company || 'N/A'}</div>
                    </div>
                    <span class="card-badge ${isMale ? 'badge-male' : 'badge-female'}">
                        <i class="fa-solid ${isMale ? 'fa-mars' : 'fa-venus'}"></i>
                        ${isMale ? 'Nam' : 'Nữ'}
                    </span>
                </div>
                <div class="card-body">
                    <div class="card-item"><i class="fa-regular fa-calendar-plus card-icon"></i> <strong>Created At:</strong> ${item.createdAt || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-user card-icon"></i> <strong>Name:</strong> ${item.name || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-venus-mars card-icon"></i> <strong>Genre:</strong> ${item.genre || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-building card-icon"></i> <strong>Company:</strong> ${item.company || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-calendar-days card-icon"></i> <strong>DOB:</strong> ${item.dob || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-clock card-icon"></i> <strong>Timezone:</strong> ${item.timezone || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-palette card-icon"></i> <strong>Color:</strong> <span style="color:${colorValue}; font-weight:bold;">${colorValue}</span></div>
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

// Khởi tạo
new VirtualCards();