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
        
        // 1. TẠO CARD MẪU TẠM THỜI để tính toán kích thước
        this.createTemporaryCard();
        this.calculateLayout(); 
        this.removeTemporaryCard();

        this.setupScrollListener();
        this.setupResizeListener();
        this.render(); // Bắt đầu render ảo
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
            this.data.sort((a, b) => Number(a.id) - Number(b.id)); 
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
    
    // Tạo card mẫu tạm thời để đo đạc
    createTemporaryCard() {
        if (this.data.length > 0 && !this.cardsGrid.querySelector('.card')) {
             const sampleCard = this.createCardElement(this.data[0]);
             sampleCard.style.visibility = 'hidden'; // Ẩn card tạm thời
             sampleCard.id = 'temp-card-for-measurement';
             this.cardsGrid.appendChild(sampleCard);
        }
    }

    // Xóa card tạm thời
    removeTemporaryCard() {
        const tempCard = this.cardsGrid.querySelector('#temp-card-for-measurement');
        if (tempCard) {
            this.cardsGrid.removeChild(tempCard);
        }
    }

    calculateLayout() {
        const gap = 30;
        
        // ✅ THAY ĐỔI LỚN: Tính cardsPerRow DỰA TRÊN KÍCH THƯỚC CONTAINER VÀ CARD TỐI THIỂU
        // Cách này mô phỏng CSS Grid auto-fit/minmax(320px) tốt hơn là đọc CSS.
        const containerWidth = this.cardsGrid.offsetWidth;
        const cardMinWidth = 320;
        
        // Tính toán số lượng card tối đa có thể vừa
        this.cardsPerRow = Math.max(1, Math.floor((containerWidth + gap) / (cardMinWidth + gap)));
        
        // Lấy cardHeight từ card tạm thời (hoặc card đã render)
        const firstCard = this.cardsGrid.querySelector('.card');
        if (firstCard) {
            const rect = firstCard.getBoundingClientRect();
            // Đảm bảo cardHeight tính cả gap (marginBottom)
            this.cardHeight = rect.height + gap; 
        } else {
            this.cardHeight = 450; 
        }

        if (this.cardHeight > 0) {
            const containerHeight = this.cardsContainer.clientHeight;
            this.visibleRows = Math.ceil(containerHeight / this.cardHeight) + 1;
        } else {
             this.visibleRows = 5; 
             this.cardHeight = 450;
        }
        console.log(`📐 Layout: cardsPerRow=${this.cardsPerRow}, cardHeight=${this.cardHeight}`);
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
                // Tái tính toán layout (cần tạo card tạm thời để đo kích thước mới)
                this.createTemporaryCard();
                this.calculateLayout();
                this.removeTemporaryCard(); 
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

    render() {
        // Kiểm tra điều kiện cần thiết
        if (this.data.length === 0 || this.cardHeight === 0 || this.cardsPerRow === 0) {
            // Cố gắng tính lại layout nếu các giá trị quan trọng bị mất
            this.createTemporaryCard();
            this.calculateLayout();
            this.removeTemporaryCard();
            if (this.cardHeight === 0 || this.cardsPerRow === 0) return;
        }

        const scrollTop = this.cardsContainer.scrollTop;
        const startRow = Math.floor(scrollTop / this.cardHeight);
        
        // Tính startIndex và offset có buffer (trừ)
        const adjustedStartRow = Math.max(0, startRow - this.bufferRows); 
        this.startIndex = adjustedStartRow * this.cardsPerRow;
        
        // Tính endIndex (visible + 2*buffer)
        const totalRowsToRender = this.visibleRows + 2 * this.bufferRows; 
        const targetEndRow = adjustedStartRow + totalRowsToRender; 
        this.endIndex = Math.min(this.data.length, targetEndRow * this.cardsPerRow); 
        
        // Tính tổng height cho spacer
        const totalRows = Math.ceil(this.data.length / this.cardsPerRow);
        const totalHeight = totalRows * this.cardHeight;
        this.cardsSpacer.style.height = totalHeight + 'px';

        // Set padding-top để tạo offset
        const offsetY = adjustedStartRow * this.cardHeight; 
        this.cardsContent.style.paddingTop = offsetY + 'px';

        this.renderVisibleCards();
    }

    /**
     * DOM Reconciliation (chỉ thêm/xóa/sắp xếp lại)
     */
    renderVisibleCards() {
        const visibleData = this.data.slice(this.startIndex, this.endIndex);
        const newVisibleIds = new Set(visibleData.map(item => Number(item.id)));

        const fragment = document.createDocumentFragment();
        
        // 1. XÓA CÁC CARD CŨ (đã ra khỏi vùng đệm)
        let nodesToRemove = [];
        // Duyệt qua các node hiện tại để tìm node cần xóa
        Array.from(this.cardsGrid.children).forEach(node => {
            const nodeId = Number(node.dataset.id); 
            if (node.id !== 'temp-card-for-measurement' && !newVisibleIds.has(nodeId)) {
                nodesToRemove.push(node);
                this.renderedCardIds.delete(nodeId);
            }
        });
        
        nodesToRemove.forEach(node => this.cardsGrid.removeChild(node));
        
        // 2. THÊM/SẮP XẾP LẠI CARD
        visibleData.forEach(item => {
            const itemId = Number(item.id);
            // Tìm card DOM hiện tại (sử dụng ID là string trong query selector)
            let cardElement = this.cardsGrid.querySelector(`[data-id="${item.id}"]`); 
            
            if (!cardElement) {
                // Card chưa tồn tại -> THÊM MỚI
                cardElement = this.createCardElement(item);
                this.renderedCardIds.add(itemId); 
            }
            // Chuyển card (mới hoặc cũ) sang Fragment để chèn lại đúng thứ tự
            fragment.appendChild(cardElement);
        });

        // 3. CHÈN FRAGMENT
        this.cardsGrid.appendChild(fragment);

        console.log(`🎨 Rendered ${this.cardsGrid.children.length} cards (index ${this.startIndex}-${this.endIndex})`);
    }

    // Trong class VirtualCards

    createCardHTML(item) {
        const isMale = item.genre?.toLowerCase() === 'male';
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