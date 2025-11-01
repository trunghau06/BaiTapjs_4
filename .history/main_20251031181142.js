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
        this.initialRender(); 
        this.calculateLayout();
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
                // Sửa: Sau khi load thêm, cần tính lại totalHeight và render
                this.render(); 
                console.log(`📦 Loaded more data. Total: ${this.data.length}`);
            }
        } catch (error) {
            console.error("Error loading more data:", error);
        }

        this.isLoading = false;
        this.loadingMore.style.display = 'none';
    }
    
    // Hàm render một số card ban đầu để tính toán cardHeight
    initialRender() {
        // Render 1-2 hàng đầu tiên
        const initialCards = this.data.slice(0, 5 * (this.cardsPerRow || 1));
        
        this.cardsGrid.innerHTML = initialCards.map(item => this.createCardHTML(item)).join('');
        
        // Cập nhật renderedCardIds
        this.renderedCardIds.clear(); // Clear any previous state
        initialCards.forEach(item => this.renderedCardIds.add(item.id));
    }

    calculateLayout() {
        const containerWidth = this.cardsGrid.offsetWidth;
        const cardWidth = 320;
        const gap = 30;

        // LẤY CARDS PER ROW TỪ CSS (Nếu dùng Grid)
        // Cách tối ưu hơn là dùng CSS để xác định cardsPerRow 
        // Tuy nhiên, vì code dựa trên fixed cardWidth, ta giữ nguyên công thức này:
        this.cardsPerRow = Math.floor((containerWidth + gap) / (cardWidth + gap)) || 1; 
        
        const firstCard = this.cardsGrid.querySelector('.card');
        if (firstCard) {
            const style = window.getComputedStyle(firstCard);
            const marginBottom = parseInt(style.marginBottom) || gap;
            this.cardHeight = firstCard.offsetHeight + marginBottom;
        } else {
            this.cardHeight = 400; // Fallback
        }

        const containerHeight = this.cardsContainer.clientHeight;
        this.visibleRows = Math.ceil(containerHeight / this.cardHeight) + 1;

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
                this.initialRender(); 
                this.calculateLayout();
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
            // SỬA: Chắc chắn render được gọi sau khi loadData hoàn tất
            this.loadData();
        }
    }

    // ... (các hàm khác giữ nguyên)

    render() 
    {
        if (this.data.length === 0) return;

        // ... (Cập nhật cardHeight giữ nguyên)
        const firstCard = this.cardsGrid.querySelector('.card');
        if (firstCard && this.cardHeight === 0) {
            const rect = firstCard.getBoundingClientRect();
            const computedStyle = window.getComputedStyle(this.cardsGrid);
            const gap = parseInt(computedStyle.gap) || 30;
            this.cardHeight = rect.height + gap;
            this.calculateLayout();
        } else if (this.cardHeight === 0) {
            this.cardHeight = 450;
        }
        
        const scrollTop = this.cardsContainer.scrollTop;
        const startRow = Math.floor(scrollTop / this.cardHeight);
        
        // Trừ buffer để lấy data sớm hơn
        const adjustedStartRow = Math.max(0, startRow - this.bufferRows); 
        this.startIndex = adjustedStartRow * this.cardsPerRow;
        
        // 🚨 SỬA LỖI QUAN TRỌNG: endRow không cần +1 vì slice() tự động loại trừ index cuối.
        // endRow là hàng cuối cùng cần hiển thị (bao gồm cả buffer)
        const totalRowsToRender = this.visibleRows + 2 * this.bufferRows; 
        const targetEndRow = startRow + totalRowsToRender;

        // Tính endIndex: Phải là index của phần tử ĐẦU TIÊN KHÔNG CẦN RENDER.
        this.endIndex = Math.min(this.data.length, targetEndRow * this.cardsPerRow); 
        
        // Tính tổng height để spacer
        const totalRows = Math.ceil(this.data.length / this.cardsPerRow);
        const totalHeight = totalRows * this.cardHeight;
        this.cardsSpacer.style.height = totalHeight + 'px';

        // Dùng adjustedStartRow để tính offset chính xác
        const offsetY = adjustedStartRow * this.cardHeight; 
        this.cardsContent.style.paddingTop = offsetY + 'px';

        // Render các cards visible
        this.renderVisibleCards();
    }

// ... (các hàm khác và renderVisibleCards() giữ nguyên)


    /**
     * SỬA ĐỔI LỚN: Triển khai DOM Reconciliation (chỉ thêm/xóa)
     */
    renderVisibleCards() {
        const visibleData = this.data.slice(this.startIndex, this.endIndex);
        const newVisibleIds = new Set(visibleData.map(item => item.id));

        const fragment = document.createDocumentFragment();
        let currentNodes = Array.from(this.cardsGrid.children);
        
        // 1. XÓA CÁC CARD CŨ (Out of bounds)
        // Duyệt ngược để xóa mà không làm mất index
        for (let i = currentNodes.length - 1; i >= 0; i--) {
            const node = currentNodes[i];
            const nodeId = node.dataset.id;
            
            if (!newVisibleIds.has(nodeId)) {
                // Card không còn nằm trong vùng hiển thị mới -> XÓA
                this.cardsGrid.removeChild(node);
                this.renderedCardIds.delete(nodeId);
                currentNodes.splice(i, 1); // Loại bỏ khỏi mảng tạm
            }
        }
        
        // 2. THÊM/SẮP XẾP LẠI CARD
        let currentCardIndex = 0;
        
        visibleData.forEach(item => {
            const itemId = item.id;
            let cardElement = null;

            if (this.renderedCardIds.has(itemId)) {
                // Card đã tồn tại (GIỮ LẠI) - Tìm trong mảng currentNodes còn lại
                const existingIndex = currentNodes.findIndex(node => node.dataset.id === itemId);
                cardElement = currentNodes[existingIndex];
                
                // Nếu cardElement tồn tại và thứ tự không đúng
                if (cardElement) {
                    // Cần re-append để đảm bảo thứ tự chính xác theo Grid flow
                    fragment.appendChild(cardElement);
                }
            } else {
                // Card chưa tồn tại (THÊM MỚI)
                cardElement = this.createCardElement(item);
                fragment.appendChild(cardElement);
                this.renderedCardIds.add(itemId); 
            }
            currentCardIndex++;
        });

        // 3. CHÈN FRAGMENT
        this.cardsGrid.appendChild(fragment);

        console.log(`🎨 Rendered ${this.cardsGrid.children.length} cards (index ${this.startIndex}-${this.endIndex})`);
    }

    // Hàm tạo phần tử DOM (Node)
    createCardElement(item) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = this.createCardHTML(item).trim();
        // Đảm bảo card có data-id
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