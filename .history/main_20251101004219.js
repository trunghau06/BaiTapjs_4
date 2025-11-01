class ResponsiveVirtualView {
    constructor() {
        this.data = [];
        this.cardsPerRow = 1;
        this.visibleRows = 0;
        this.bufferRows = 5;
        this.startIndex = 0;
        this.endIndex = 0;
        this.rowHeight = 0;
        this.isLoading = false;
        this.hasMore = true;
        this.currentPage = 1;

        this.renderedCardIds = new Set();

        // DOM elements
        this.cardsContainer = document.getElementById('cardsContainer');
        this.cardsSpacer = document.getElementById('cardsSpacer');
        this.cardsContent = document.getElementById('cardsContent');
        this.cardView = document.getElementById('cardView');
        this.tableView = document.getElementById('tableView');
        this.tableBody = document.getElementById('tableBody');

        this.loader = document.getElementById('loader');
        this.loadingMore = document.getElementById('loadingMore');

        this.fakeWrapper = document.querySelector('.fake-scroll-wrapper');
        this.fakeScroll = document.getElementById('fakeScroll');
        this.table = document.querySelector('.data-table');

        this.init();
    }

    get isMobileView() {
        return window.innerWidth <= 768;
    }

    async init() {
        await this.loadInitialData();
        this.cardsContainer.style.display = 'block';

        window.requestAnimationFrame(() => {
            this.updateLayout();

            this.setupScrollListener();
            this.setupHorizontalSync();
            this.setupResizeListener();
            this.render();
            this.loader.style.display = 'none';
        });
    }

    async loadInitialData() {
        const promises = [];
        for (let page = 1; page <= 5; page++) {
            promises.push(
                fetch(`https://671891927fc4c5ff8f49fcac.mockapi.io/v2?page=${page}&limit=20`).then(res => res.json())
            );
        }
        try {
            const results = await Promise.all(promises);
            this.data = results.flat();
            this.data.sort((a, b) => Number(a.id) - Number(b.id));
            this.currentPage = 6;
        } catch (error) {
            console.error("Error loading initial data:", error);
        }
    }

    async loadData() {
        if (this.isLoading || !this.hasMore) return;
        this.isLoading = true;
        this.loadingMore.style.display = 'block';

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

    // --- SCROLL HORIZONTAL ---
    setupHorizontalSync() {
        const updateFakeWidth = () => {
            if (!this.table) return;
            this.fakeScroll.style.minWidth = this.table.scrollWidth + 'px';
        };
        updateFakeWidth();

        this.fakeWrapper.addEventListener('scroll', () => {
            this.cardsContainer.scrollLeft = this.fakeWrapper.scrollLeft;
        });

        this.cardsContainer.addEventListener('scroll', () => {
            if (!this.isMobileView) {
                this.fakeWrapper.scrollLeft = this.cardsContainer.scrollLeft;
            }
        });

        window.addEventListener('resize', () => {
            updateFakeWidth();
        });

        const observer = new ResizeObserver(() => {
            updateFakeWidth();
        });
        observer.observe(this.table);
    }

    // --- SCROLL VERTICAL ---
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
                this.updateLayout();
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

    updateLayout() {
        const targetContainer = this.isMobileView ? this.cardView : this.tableBody;
        const className = this.isMobileView ? '.card' : '.data-row';
        const gap = this.isMobileView ? 15 : 0;

        this.cardsPerRow = 1;

        let sampleEl = targetContainer.querySelector(className);
        if (!sampleEl && this.data.length > 0) {
            sampleEl = this.isMobileView
                ? this.createCardElement(this.data[0])
                : this.createRowElement(this.data[0]);
            sampleEl.style.visibility = 'hidden';
            targetContainer.appendChild(sampleEl);
        }

        if (sampleEl) {
            const rect = sampleEl.getBoundingClientRect();
            this.rowHeight = rect.height + gap;
        } else {
            this.rowHeight = this.isMobileView ? 250 : 80;
        }

        if (sampleEl) {
            const containerHeight = this.cardsContainer.clientHeight;
            this.visibleRows = Math.ceil(containerHeight / this.rowHeight) + 1;
        } else {
            this.visibleRows = 10;
        }

        if (sampleEl) sampleEl.remove();
    }

    render() {
        if (!this.rowHeight) return;

        const scrollTop = this.cardsContainer.scrollTop;
        const startRow = Math.floor(scrollTop / this.rowHeight);
        const adjustedStartRow = Math.max(0, startRow - this.bufferRows);
        this.startIndex = adjustedStartRow;

        const totalRowsToRender = this.visibleRows + 2 * this.bufferRows;
        const targetEndRow = adjustedStartRow + totalRowsToRender;
        this.endIndex = Math.min(this.data.length, targetEndRow);

        const totalHeight = this.data.length * this.rowHeight;
        this.cardsSpacer.style.height = totalHeight + 'px';

        const offsetY = adjustedStartRow * this.rowHeight;
        this.cardsContent.style.paddingTop = offsetY + 'px';

        this.renderVisibleElements();
    }

    renderVisibleElements() {
        const targetContainer = this.isMobileView ? this.cardView : this.tableBody;
        const viewToShow = this.isMobileView ? this.cardView : this.tableView;
        const viewToHide = this.isMobileView ? this.tableView : this.cardView;

        viewToShow.style.display = 'block';
        viewToHide.style.display = 'none';

        const visibleData = this.data.slice(this.startIndex, this.endIndex);
        const newVisibleIds = new Set(visibleData.map(i => Number(i.id)));

        // Remove old
        Array.from(targetContainer.children).forEach(node => {
            const nodeId = Number(node.dataset.id);
            if (!newVisibleIds.has(nodeId)) {
                targetContainer.removeChild(node);
                this.renderedCardIds.delete(nodeId);
            }
        });

        // Add new
        const fragment = document.createDocumentFragment();
        visibleData.forEach(item => {
            let el = targetContainer.querySelector(`[data-id="${item.id}"]`);
            if (!el) {
                el = this.isMobileView ? this.createCardElement(item) : this.createRowElement(item);
                this.renderedCardIds.add(Number(item.id));
            }
            fragment.appendChild(el);
        });

        targetContainer.appendChild(fragment);
    }

    // --- HTML GENERATORS ---
    createRowElement(item) {
        const temp = document.createElement('tbody');
        temp.innerHTML = this.createRowHTML(item);
        const tr = temp.firstChild;
        tr.setAttribute('data-id', item.id);
        return tr;
    }

    createRowHTML(item) {
        const isMale = item.genre?.toLowerCase() === 'male';
        const badgeClass = isMale ? 'badge-male' : 'badge-female';
        const badgeText = isMale ? 'Nam' : 'Nữ';
        return `
            <tr class="data-row" data-id="${item.id}">
                <td>${item.id}</td>
                <td><img src="${item.avatar}" class="avatar-small"></td>
                <td>${item.name}</td>
                <td>${item.company}</td>
                <td><span class="${badgeClass}">${badgeText}</span></td>
                <td>${item.email}</td>
                <td>${item.phone}</td>
            </tr>
        `;
    }

    createCardElement(item) {
        const temp = document.createElement('div');
        temp.innerHTML = this.createCardHTML(item);
        const div = temp.firstChild;
        div.setAttribute('data-id', item.id);
        return div;
    }

    createCardHTML(item) {
        const isMale = item.genre?.toLowerCase() === 'male';
        const genderText = isMale ? 'Nam' : 'Nữ';
        return `
            <div class="card" data-id="${item.id}">
                <div class="card-header">
                    <img src="${item.avatar}" class="avatar">
                    <div class="card-info">
                        <div>${item.name}</div>
                        <div>${item.company}</div>
                    </div>
                    <span class="badge ${isMale ? 'badge-male' : 'badge-female'}">${genderText}</span>
                </div>
            </div>
        `;
    }
}

new ResponsiveVirtualView();
