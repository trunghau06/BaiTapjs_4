class VirtualCards {
    constructor() {
        this.data = []; // tất cả dữ liệu
        this.cardsPerRow = 0;
        this.visibleRows = 0;
        this.bufferRows = 2; // số hàng buffer
        this.startIndex = 0;
        this.endIndex = 0;
        this.isLoading = false;
        this.hasMore = true;
        this.currentPage = 1;
        this.cardHeight = 0;

        this.renderedCardIds = new Set(); // id card đang render

        // DOM
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

        this.createTempCard();
        this.calculateLayout();
        this.removeTempCard();

        this.setupScrollListener();
        this.setupResizeListener();

        this.render(); // render lần đầu
        this.loader.style.display = 'none';
    }

    async loadInitialData() {
        try {
            const promises = [];
            for (let page = 1; page <= 1; page++) { // chỉ load 1 page ban đầu
                promises.push(
                    fetch(`https://671891927fc4c5ff8f49fcac.mockapi.io/v2?page=${page}&limit=20`).then(r => r.json())
                );
            }
            const results = await Promise.all(promises);
            this.data = results.flat();
            this.data.sort((a, b) => Number(a.id) - Number(b.id));
            this.currentPage = 2;
        } catch (err) {
            console.error(err);
        }
    }

    async loadMoreData() {
        if (this.isLoading || !this.hasMore) return;
        this.isLoading = true;
        this.loadingMore.style.display = 'block';

        try {
            const res = await fetch(`https://671891927fc4c5ff8f49fcac.mockapi.io/v2?page=${this.currentPage}&limit=20`);
            const newData = await res.json();
            if (newData.length === 0) {
                this.hasMore = false;
            } else {
                this.data.push(...newData);
                this.data.sort((a, b) => Number(a.id) - Number(b.id));
                this.currentPage++;
                this.render();
            }
        } catch (err) {
            console.error(err);
        }

        this.isLoading = false;
        this.loadingMore.style.display = 'none';
    }

    createTempCard() {
        if (this.data.length > 0 && !this.cardsGrid.querySelector('.card')) {
            const card = this.createCardElement(this.data[0]);
            card.style.visibility = 'hidden';
            card.id = 'temp-card';
            this.cardsGrid.appendChild(card);
        }
    }

    removeTempCard() {
        const temp = document.getElementById('temp-card');
        if (temp) this.cardsGrid.removeChild(temp);
    }

    calculateLayout() {
        const gap = 30;
        const containerWidth = this.cardsGrid.offsetWidth;
        const cardWidth = 320;
        this.cardsPerRow = Math.max(1, Math.floor((containerWidth + gap) / (cardWidth + gap)));

        const firstCard = this.cardsGrid.querySelector('.card');
        if (firstCard) {
            const rect = firstCard.getBoundingClientRect();
            this.cardHeight = rect.height + gap;
        } else {
            this.cardHeight = 450;
        }

        const containerHeight = this.cardsContainer.clientHeight;
        this.visibleRows = Math.ceil(containerHeight / this.cardHeight) + 1;
    }

    setupScrollListener() {
        let timeout;
        this.cardsContainer.addEventListener('scroll', () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                this.render();
                this.checkLoadMore();
            }, 16);
        });
    }

    setupResizeListener() {
        let timeout;
        window.addEventListener('resize', () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                this.createTempCard();
                this.calculateLayout();
                this.removeTempCard();
                this.render();
            }, 300);
        });
    }

    checkLoadMore() {
        const scrollTop = this.cardsContainer.scrollTop;
        const scrollHeight = this.cardsContainer.scrollHeight;
        const clientHeight = this.cardsContainer.clientHeight;
        const scrollPercent = (scrollTop + clientHeight) / scrollHeight;
        if (scrollPercent > 0.8) this.loadMoreData();
    }

    render() {
        if (!this.cardHeight || !this.cardsPerRow) return;

        const scrollTop = this.cardsContainer.scrollTop;
        const startRow = Math.floor(scrollTop / this.cardHeight);
        const adjustedStartRow = Math.max(0, startRow - this.bufferRows);
        this.startIndex = adjustedStartRow * this.cardsPerRow;

        const totalRows = this.visibleRows + this.bufferRows * 2;
        const targetEndRow = adjustedStartRow + totalRows;
        this.endIndex = Math.min(this.data.length, targetEndRow * this.cardsPerRow);

        const totalRowsAll = Math.ceil(this.data.length / this.cardsPerRow);
        this.cardsSpacer.style.height = totalRowsAll * this.cardHeight + 'px';
        this.cardsContent.style.paddingTop = adjustedStartRow * this.cardHeight + 'px';

        this.renderVisibleCards();
    }

    renderVisibleCards() {
        const visibleData = this.data.slice(this.startIndex, this.endIndex);
        const visibleIds = new Set(visibleData.map(d => Number(d.id)));

        // Xóa card cũ không còn trong viewport
        Array.from(this.cardsGrid.children).forEach(node => {
            const id = Number(node.dataset.id);
            if (!visibleIds.has(id)) {
                this.cardsGrid.removeChild(node);
                this.renderedCardIds.delete(id);
            }
        });

        // Thêm card mới
        visibleData.forEach(item => {
            const id = Number(item.id);
            if (!this.renderedCardIds.has(id)) {
                const card = this.createCardElement(item);
                card.style.position = 'absolute';
                const index = this.data.indexOf(item);
                const row = Math.floor(index / this.cardsPerRow);
                const col = index % this.cardsPerRow;
                card.style.top = row * this.cardHeight + 'px';
                card.style.left = col * (320 + 30) + 'px';
                this.cardsGrid.appendChild(card);
                this.renderedCardIds.add(id);
            }
        });
    }

    createCardElement(item) {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.id = item.id;

        // Header
        const header = document.createElement('div');
        header.className = 'card-header';

        const avatar = document.createElement('img');
        avatar.className = 'avatar';
        avatar.src = item.avatar;
        avatar.alt = item.name;
        avatar.loading = 'lazy';

        const info = document.createElement('div');
        info.className = 'card-info';

        const name = document.createElement('div');
        name.className = 'card-name';
        name.textContent = item.name || 'N/A';

        const company = document.createElement('div');
        company.className = 'card-company';
        company.textContent = item.company || 'N/A';

        info.appendChild(name);
        info.appendChild(company);

        const badge = document.createElement('span');
        badge.className = `card-badge ${item.genre?.toLowerCase() === 'male' ? 'badge-male' : 'badge-female'}`;
        badge.innerHTML = `<i class="fa-solid ${item.genre?.toLowerCase() === 'male' ? 'fa-mars' : 'fa-venus'}"></i> ${item.genre?.toLowerCase() === 'male' ? 'Nam' : 'Nu'}`;

        header.appendChild(avatar);
        header.appendChild(info);
        header.appendChild(badge);

        // Body
        const body = document.createElement('div');
        body.className = 'card-body';

        const fields = [
            ['fa-id-badge', 'ID', item.id],
            ['fa-regular fa-calendar-plus', 'Created At', item.createdAt],
            ['fa-user', 'Name', item.name],
            ['fa-venus-mars', 'Genre', item.genre],
            ['fa-building', 'Company', item.company],
            ['fa-calendar-days', 'DOB', item.dob],
            ['fa-clock', 'Timezone', item.timezone],
            ['fa-palette', 'Color', item.color],
            ['fa-music', 'Music', item.music],
            ['fa-map-location-dot', 'Address', item.address],
            ['fa-city', 'City', item.city],
            ['fa-map', 'State', item.state],
            ['fa-road', 'Street', item.street],
            ['fa-building-columns', 'Building', item.building],
            ['fa-hashtag', 'ZIP', item.zip || item.zipcode],
            ['fa-envelope', 'Email', item.email],
            ['fa-phone', 'Phone', item.phone],
            ['fa-lock', 'Password', item.password],
        ];

        fields.forEach(([iconClass, label, value]) => {
            const div = document.createElement('div');
            div.className = 'card-item';
            div.innerHTML = `<i class="fa-solid ${iconClass} card-icon"></i> <strong>${label}:</strong> ${value || 'N/A'}`;
            body.appendChild(div);
        });

        card.appendChild(header);
        card.appendChild(body);

        return card;
    }
}

new VirtualCards();
