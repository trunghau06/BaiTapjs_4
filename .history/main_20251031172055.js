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
        this.renderedCards = new Map(); // Cache DOM elements

        this.cardsContainer = document.getElementById('cardsContainer');
        this.cardsSpacer = document.getElementById('cardsSpacer');
        this.cardsContent = document.getElementById('cardsContent');
        this.cardsGrid = document.getElementById('cardsGrid');
        this.loader = document.getElementById('loader');
        this.loadingMore = document.getElementById('loadingMore');

        this.init();
    }

    async init() {
        // Load 100 records trước khi hiển thị
        await this.loadInitialData();
        
        this.cardsContainer.style.display = 'block';
        this.calculateLayout();
        this.setupScrollListener();
        this.setupResizeListener();
        this.render();
        this.loader.style.display = 'none';
    }

    async loadInitialData() {
        // Load 100 records (5 pages x 20 items)
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
            this.currentPage = 6; // Next page to load
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
                console.log(`📦 Loaded more data. Total: ${this.data.length}`);
            }
        } catch (error) {
            console.error("Error loading more data:", error);
        }

        this.isLoading = false;
        this.loadingMore.style.display = 'none';
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
            }, 16); // ~60fps
        });
    }

    setupResizeListener() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.renderedCards.clear(); // Clear cache khi resize
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

        // Update cardHeight nếu chưa có
        if (this.cardHeight === 0) {
            const firstCard = this.cardsGrid.querySelector('.card');
            if (firstCard) {
                this.cardHeight = firstCard.offsetHeight + 30;
            } else {
                this.cardHeight = 400;
            }
        }

        const scrollTop = this.cardsContainer.scrollTop;
        const startRow = Math.floor(scrollTop / this.cardHeight);
        const adjustedStartRow = Math.max(0, startRow - this.bufferRows);
        
        this.startIndex = adjustedStartRow * this.cardsPerRow;
        const endRow = startRow + this.visibleRows + this.bufferRows * 2;
        this.endIndex = Math.min(this.data.length, endRow * this.cardsPerRow);

        // Tính toán total height
        const totalRows = Math.ceil(this.data.length / this.cardsPerRow);
        const totalHeight = totalRows * this.cardHeight;
        this.cardsSpacer.style.height = totalHeight + 'px';

        // Transform offset
        const offsetY = adjustedStartRow * this.cardHeight;
        this.cardsContent.style.transform = `translateY(${offsetY}px)`;

        // Render chỉ các cards visible
        this.renderVisibleCards();
    }

    renderVisibleCards() {
        const fragment = document.createDocumentFragment();
        const visibleData = this.data.slice(this.startIndex, this.endIndex);

        // Xóa các cards cũ không còn visible
        const currentCards = this.cardsGrid.querySelectorAll('.card');
        currentCards.forEach(card => {
            const cardId = card.dataset.id;
            if (!visibleData.find(item => item.id === cardId)) {
                card.remove();
                this.renderedCards.delete(cardId);
            }
        });

        // Render hoặc reuse cards
        visibleData.forEach(item => {
            let cardElement = this.renderedCards.get(item.id);
            
            if (!cardElement) {
                cardElement = this.createCardElement(item);
                this.renderedCards.set(item.id, cardElement);
            }
            
            fragment.appendChild(cardElement);
        });

        // Clear và append
        this.cardsGrid.innerHTML = '';
        this.cardsGrid.appendChild(fragment);

        console.log(`🎨 Rendered ${visibleData.length} cards (${this.startIndex}-${this.endIndex})`);
    }

    createCardElement(item) {
        const div = document.createElement('div');
        div.className = 'card';
        div.dataset.id = item.id;

        const isMale = item.genre?.toLowerCase() === 'male';
        const colorValue = item.color || '#000';

        div.innerHTML = `
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
        `;

        return div;
    }
}

new VirtualCards();