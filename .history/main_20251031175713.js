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
        this.calculateLayout();
        this.setupScrollListener();
        this.setupResizeListener();
        this.render();
        this.loader.style.display = 'none';
    }

    async loadInitialData() {
        const promises = [];
        for (let page = 1; page <= 5; page++) { // Load 5 pages x 20 items = 100 cards
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

        // Cập nhật cardHeight từ DOM thực tế
        const firstCard = this.cardsGrid.querySelector('.card');
        if (firstCard) {
            const rect = firstCard.getBoundingClientRect();
            const computedStyle = window.getComputedStyle(this.cardsGrid);
            const gap = parseInt(computedStyle.gap) || 30;
            this.cardHeight = rect.height + gap;
        } else if (this.cardHeight === 0) {
            this.cardHeight = 450; // fallback
        }

        const scrollTop = this.cardsContainer.scrollTop;
        const startRow = Math.floor(scrollTop / this.cardHeight);

        // SỬA: không trừ buffer ở startIndex
        this.startIndex = startRow * this.cardsPerRow;

        const endRow = startRow + this.visibleRows + this.bufferRows;
        this.endIndex = Math.min(this.data.length, (endRow + 1) * this.cardsPerRow);

        const totalRows = Math.ceil(this.data.length / this.cardsPerRow);
        const totalHeight = totalRows * this.cardHeight;
        this.cardsSpacer.style.height = totalHeight + 'px';

        const offsetY = startRow * this.cardHeight;
        this.cardsContent.style.paddingTop = offsetY + 'px';
        this.cardsContent.style.transform = 'none';

        this.renderVisibleCards();
    }

    renderVisibleCards() {
        const visibleData = this.data.slice(this.startIndex, this.endIndex);

        this.cardsGrid.innerHTML = visibleData
            .map(item => this.createCardHTML(item))
            .join('');

        console.log(`🎨 Rendered ${visibleData.length} cards (index ${this.startIndex}-${this.endIndex})`);
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
