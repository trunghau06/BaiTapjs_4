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

        this.cardPool = []; // Reuse DOM card elements

        this.init();
    }

    async init() {
        this.cardsContainer.style.display = 'block';
        this.calculateLayout();
        await this.loadData(); // Load page đầu tiên
        this.setupScrollListener();
        this.setupResizeListener();
        this.render();
        this.loader.style.display = 'none';
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
            }
        } catch (error) {
            console.error("Error loading data:", error);
        }

        this.isLoading = false;
        this.loadingMore.style.display = 'none';
    }

    calculateLayout() {
        const containerWidth = this.cardsGrid.offsetWidth;
        const cardWidth = 320;
        const gap = 20;

        this.cardsPerRow = Math.floor((containerWidth + gap) / (cardWidth + gap)) || 1;

        // Fallback cardHeight nếu chưa render
        this.cardHeight = 400;

        const containerHeight = this.cardsContainer.clientHeight;
        this.visibleRows = Math.ceil(containerHeight / this.cardHeight) + 1;
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
            }, 200);
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

        // Cập nhật cardHeight nếu đã render ít nhất 1 card
        const firstCard = this.cardsGrid.querySelector('.card');
        if (firstCard) {
            const rect = firstCard.getBoundingClientRect();
            this.cardHeight = rect.height + 20;
        }

        const scrollTop = this.cardsContainer.scrollTop;
        const startRow = Math.floor(scrollTop / this.cardHeight);
        const adjustedStartRow = Math.max(0, startRow - this.bufferRows);
        this.startIndex = adjustedStartRow * this.cardsPerRow;

        const endRow = startRow + this.visibleRows + this.bufferRows * 2;
        this.endIndex = Math.min(this.data.length, endRow * this.cardsPerRow);

        const totalRows = Math.ceil(this.data.length / this.cardsPerRow);
        const totalHeight = totalRows * this.cardHeight;
        this.cardsSpacer.style.height = totalHeight + 'px';

        // Dùng padding-top để offset
        const offsetY = adjustedStartRow * this.cardHeight;
        this.cardsContent.style.paddingTop = offsetY + 'px';

        // Render bằng reuse DOM card
        this.renderVisibleCards();
    }

    renderVisibleCards() {
        const visibleData = this.data.slice(this.startIndex, this.endIndex);
        const fragment = document.createDocumentFragment();

        // Reuse pool
        while (this.cardPool.length < visibleData.length) {
            const div = document.createElement('div');
            div.className = 'card';
            this.cardPool.push(div);
        }

        visibleData.forEach((item, i) => {
            const card = this.cardPool[i];
            card.innerHTML = this.createCardHTML(item);
            fragment.appendChild(card);
        });

        this.cardsGrid.innerHTML = '';
        this.cardsGrid.appendChild(fragment);
    }

    createCardHTML(item) {
        const isMale = item.genre?.toLowerCase() === 'male';
        const colorValue = item.color || '#000';

        return `
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
                <div class="card-item"><strong>Name:</strong> ${item.name || 'N/A'}</div>
                <div class="card-item"><strong>Company:</strong> ${item.company || 'N/A'}</div>
                <div class="card-item"><strong>Genre:</strong> ${item.genre || 'N/A'}</div>
                <div class="card-item"><strong>DOB:</strong> ${item.dob || 'N/A'}</div>
                <div class="card-item"><strong>Email:</strong> ${item.email || 'N/A'}</div>
            </div>
        `;
    }
}

// Initialize
new VirtualCards();
