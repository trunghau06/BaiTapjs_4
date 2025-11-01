class VirtualCards {
    constructor() {
        this.data = [];
        this.cardsPerRow = 0;
        this.visibleRows = 0;
        this.bufferRows = 2; // buffer rows để scroll mượt
        this.startIndex = 0;
        this.endIndex = 0;
        this.isLoading = false;
        this.hasMore = true;
        this.currentPage = 1;
        this.cardHeight = 0; // sẽ lấy từ DOM sau render
        this.gap = 20;

        this.cardsContainer = document.getElementById('cardsContainer');
        this.cardsSpacer = document.getElementById('cardsSpacer');
        this.cardsContent = document.getElementById('cardsContent');
        this.cardsGrid = document.getElementById('cardsGrid');
        this.loader = document.getElementById('loader');
        this.loadingMore = document.getElementById('loadingMore');

        this.renderedCards = new Map(); // lưu các card đang render

        this.init();
    }

    async init() {
        await this.loadData();
        this.cardsContainer.style.display = 'block';
        this.calculateLayout();
        this.setupScrollListener();
        this.setupResizeListener();
        this.render();
        this.loader.style.display = 'none';
    }

    async loadData() {
        if (this.isLoading || !this.hasMore) return;
        this.isLoading = true;
        if (this.currentPage > 1) this.loadingMore.style.display = "block";

        try {
            const response = await fetch(`https://671891927fc4c5ff8f49fcac.mockapi.io/v2?page=${this.currentPage}&limit=20`);
            const newData = await response.json();
            if (newData.length === 0) this.hasMore = false;
            else {
                this.data = [...this.data, ...newData];
                this.currentPage++;
            }
        } catch (error) {
            console.error("Error: ", error);
        }

        this.isLoading = false;
        this.loadingMore.style.display = 'none';
    }

    calculateLayout() {
        const containerWidth = this.cardsGrid.offsetWidth;
        const cardWidth = 320;
        this.cardsPerRow = Math.max(1, Math.floor((containerWidth + this.gap) / (cardWidth + this.gap)));
        const containerHeight = this.cardsContainer.clientHeight;
        // nếu chưa render card thì dùng fallback
        this.cardHeight = this.cardsGrid.querySelector('.card')?.offsetHeight + this.gap || 200;
        this.visibleRows = Math.ceil(containerHeight / this.cardHeight) + 1;
    }

    setupScrollListener() {
        this.cardsContainer.addEventListener('scroll', () => {
            this.render();
            this.checkLoadMore();
        });
    }

    setupResizeListener() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.calculateLayout();
                this.render(true); // true: clear cache và render lại
            }, 200);
        });
    }

    checkLoadMore() {
        const scrollTop = this.cardsContainer.scrollTop;
        const scrollHeight = this.cardsContainer.scrollHeight;
        const clientHeight = this.cardsContainer.clientHeight;
        if ((scrollTop + clientHeight) / scrollHeight > 0.7 && !this.isLoading && this.hasMore) {
            this.loadData().then(() => this.render());
        }
    }

    render(force = false) {
        if (this.data.length === 0) return;

        // update cardHeight thực tế nếu đã render
        const firstCard = this.cardsGrid.querySelector('.card');
        if (firstCard) this.cardHeight = firstCard.offsetHeight + this.gap;

        const scrollTop = this.cardsContainer.scrollTop;
        const startRow = Math.max(0, Math.floor(scrollTop / this.cardHeight) - this.bufferRows);
        const endRow = startRow + this.visibleRows + this.bufferRows * 2;

        const startIndex = startRow * this.cardsPerRow;
        const endIndex = Math.min(this.data.length, endRow * this.cardsPerRow);

        // update spacer height
        const totalRows = Math.ceil(this.data.length / this.cardsPerRow);
        this.cardsSpacer.style.height = totalRows * this.cardHeight + 'px';

        // di chuyển container
        this.cardsContent.style.transform = `translateY(${startRow * this.cardHeight}px)`;

        // remove những card không còn hiển thị
        for (let key of this.renderedCards.keys()) {
            if (key < startIndex || key >= endIndex) {
                this.renderedCards.get(key).remove();
                this.renderedCards.delete(key);
            }
        }

        // render những card cần thiết
        for (let i = startIndex; i < endIndex; i++) {
            if (!this.renderedCards.has(i)) {
                const cardHTML = this.createCard(this.data[i]);
                const temp = document.createElement('div');
                temp.innerHTML = cardHTML;
                const cardElement = temp.firstElementChild;
                cardElement.style.position = 'absolute';
                cardElement.style.top = `${Math.floor(i / this.cardsPerRow) * this.cardHeight}px`;
                cardElement.style.left = `${(i % this.cardsPerRow) * (320 + this.gap)}px`;
                this.cardsGrid.appendChild(cardElement);
                this.renderedCards.set(i, cardElement);
            }
        }
    }

    createCard(item) {
        const isMale = item.genre?.toLowerCase() === 'male';
        const colorValue = item.color || '#000';
        return `
        <div class="card">
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
        </div>`;
    }
}

new VirtualCards();
