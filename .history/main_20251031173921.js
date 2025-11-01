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

        // BỘ NHỚ ĐỆM MỚI: Theo dõi ID của các card đang có trong DOM
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
        // Bước mới: Render ban đầu để lấy kích thước card thực tế
        this.initialRender(); 
        this.calculateLayout();
        this.setupScrollListener();
        this.setupResizeListener();
        this.render(); // Render lại với layout đã tính
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

        // Tải thêm dữ liệu
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
        // Render 1-2 hàng đầu tiên (đảm bảo cardsPerRow có giá trị)
        const initialCards = this.data.slice(0, 5 * (this.cardsPerRow || 1));
        
        // Sử dụng innerHTML cho lần render duy nhất này
        this.cardsGrid.innerHTML = initialCards.map(item => this.createCardHTML(item)).join('');
        
        // Cập nhật renderedCardIds
        initialCards.forEach(item => this.renderedCardIds.add(item.id));
    }

    calculateLayout() {
        const containerWidth = this.cardsGrid.offsetWidth;
        const cardWidth = 320;
        const gap = 30;

        this.cardsPerRow = Math.floor((containerWidth + gap) / (cardWidth + gap)) || 1;

        // Lấy chiều cao card thực tế
        const firstCard = this.cardsGrid.querySelector('.card');
        if (firstCard) {
            const cardStyle = window.getComputedStyle(firstCard);
            const marginBottom = parseInt(cardStyle.marginBottom) || gap;
            this.cardHeight = firstCard.offsetHeight + marginBottom;
        } else {
            this.cardHeight = 400; // Fallback ước tính
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
                // Đặt lại layout khi resize
                this.renderedCardIds.clear(); 
                this.cardsGrid.innerHTML = ''; // Xóa DOM hiện tại
                this.initialRender(); // Render lại ban đầu để tính layout
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
            this.loadData().then(() => this.render());
        }
    }

    render() {
        if (this.data.length === 0) return;

        // Cập nhật cardHeight nếu nó chưa được thiết lập (chỉ cần trong lần render đầu)
        if (this.cardHeight === 0) {
            const firstCard = this.cardsGrid.querySelector('.card');
            if (firstCard) {
                const rect = firstCard.getBoundingClientRect();
                const computedStyle = window.getComputedStyle(this.cardsGrid);
                const gap = parseInt(computedStyle.gap) || 30;
                this.cardHeight = rect.height + gap;
                this.calculateLayout();
            } else {
                this.cardHeight = 450;
            }
        }
        
        const scrollTop = this.cardsContainer.scrollTop;
        const startRow = Math.floor(scrollTop / this.cardHeight);
        const adjustedStartRow = Math.max(0, startRow - this.bufferRows);
        
        this.startIndex = adjustedStartRow * this.cardsPerRow;
        
        // endRow = startRow + các hàng thấy được + 2x buffer
        const endRow = startRow + this.visibleRows + this.bufferRows * 2; 
        this.endIndex = Math.min(this.data.length, (endRow) * this.cardsPerRow); 
        // Đảm bảo endIndex không vượt quá tổng số data

        // Tính toán total height (quan trọng cho cuộn ảo)
        const totalRows = Math.ceil(this.data.length / this.cardsPerRow);
        const totalHeight = totalRows * this.cardHeight;
        this.cardsSpacer.style.height = totalHeight + 'px';

        // Dùng padding-top để tạo offset
        const offsetY = adjustedStartRow * this.cardHeight;
        this.cardsContent.style.paddingTop = offsetY + 'px';

        // Render chỉ các cards visible với tối ưu DOM
        this.renderVisibleCards();
    }

    /**
     * SỬA ĐỔI: Sử dụng DOM Reconciliation (so sánh và chỉ thêm/xóa)
     */
    renderVisibleCards() {
        const visibleData = this.data.slice(this.startIndex, this.endIndex);
        const newVisibleIds = new Set(visibleData.map(item => item.id));

        const fragment = document.createDocumentFragment();
        // Lấy danh sách các node hiện tại trong cardsGrid
        const currentNodes = Array.from(this.cardsGrid.children);
        
        // 1. XÓA CÁC CARD CŨ (đã trượt ra khỏi viewport + buffer)
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
        
        // 2. THÊM/GIỮ LẠI VÀ SẮP XẾP CARD MỚI
        let currentCardIndex = 0;
        
        visibleData.forEach(item => {
            const itemId = item.id;
            let cardElement = null;

            if (this.renderedCardIds.has(itemId)) {
                // Card đã tồn tại trong DOM (GIỮ LẠI)
                const existingIndex = currentNodes.findIndex(node => node.dataset.id === itemId);
                cardElement = currentNodes[existingIndex];
                
                // Nếu cardElement cần di chuyển vị trí
                if (cardElement.nextSibling && cardElement.nextSibling !== this.cardsGrid.children[currentCardIndex + 1]) {
                     // Chuyển node sang Fragment để chèn lại đúng vị trí
                     fragment.appendChild(cardElement);
                } else if (!cardElement.nextSibling && currentCardIndex < this.cardsGrid.children.length) {
                    // Xử lý trường hợp thêm card ở cuối
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

        // 3. CHÈN TẤT CẢ CARD MỚI VÀ CARD ĐÃ GIỮ LẠI VÀO CONTAINER
        // Việc chèn Fragment sẽ tối ưu vì nó chỉ thực hiện một thao tác render lớn
        this.cardsGrid.appendChild(fragment);

        console.log(`🎨 Rendered ${this.cardsGrid.children.length} cards (index ${this.startIndex}-${this.endIndex}, IDs: ${visibleData[0]?.id} → ${visibleData[visibleData.length-1]?.id})`);
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
        // ... (Hàm này giữ nguyên, tạo chuỗi HTML)
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

// Initialize
new VirtualCards();