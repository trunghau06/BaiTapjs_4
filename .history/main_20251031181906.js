class VirtualCards {
    // ... (giữ nguyên constructor và các method khác)

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
            // Sort theo ID để đảm bảo liên tục (nếu API không trả đúng)
            this.data.sort((a, b) => a.id - b.id);
            this.currentPage = 6;
            console.log('Initial data IDs:', this.data.map(d => d.id));  // Debug
        } catch (error) {
            console.error("Error loading initial data:", error);
        }
    }

    calculateLayout() {
        const containerWidth = this.cardsGrid.offsetWidth;
        const cardWidth = 320;
        const gap = 30;

        // Tính chính xác hơn: số card per row dựa trên width thực
        this.cardsPerRow = Math.max(1, Math.floor((containerWidth + gap) / (cardWidth + gap)));
        
        // Tạo sample card để đo height
        if (!this.cardsGrid.querySelector('.card') && this.data.length > 0) {
            const sampleCard = this.createCardElement(this.data[0]);
            this.cardsGrid.appendChild(sampleCard);
        }
        const firstCard = this.cardsGrid.querySelector('.card');
        if (firstCard) {
            const rect = firstCard.getBoundingClientRect();
            this.cardHeight = rect.height + gap;  // Dùng getBoundingClientRect cho chính xác
            if (this.renderedCardIds.size === 0) this.cardsGrid.removeChild(firstCard);
        } else {
            this.cardHeight = 450;
        }

        const containerHeight = this.cardsContainer.clientHeight;
        this.visibleRows = Math.ceil(containerHeight / this.cardHeight) + 1;
        console.log(`Layout: cardsPerRow=${this.cardsPerRow}, cardHeight=${this.cardHeight}`);  // Debug
    }

    render() {
        if (this.data.length === 0 || this.cardHeight === 0) return;

        const scrollTop = this.cardsContainer.scrollTop;
        const startRow = Math.floor(scrollTop / this.cardHeight);
        const adjustedStartRow = Math.max(0, startRow - this.bufferRows);
        this.startIndex = adjustedStartRow * this.cardsPerRow;
        const totalRowsToRender = this.visibleRows + 2 * this.bufferRows;
        const targetEndRow = startRow + totalRowsToRender;
        this.endIndex = Math.min(this.data.length, targetEndRow * this.cardsPerRow);

        console.log(`Render: startIndex=${this.startIndex}, endIndex=${this.endIndex}, visible IDs: ${this.data.slice(this.startIndex, this.endIndex).map(d => d.id)}`);  // Debug

        const totalRows = Math.ceil(this.data.length / this.cardsPerRow);
        const totalHeight = totalRows * this.cardHeight;
        this.cardsSpacer.style.height = totalHeight + 'px';
        const offsetY = adjustedStartRow * this.cardHeight;
        this.cardsContent.style.paddingTop = offsetY + 'px';

        this.renderVisibleCards();
    }

    renderVisibleCards() {
        const visibleData = this.data.slice(this.startIndex, this.endIndex);
        const newVisibleIds = new Set(visibleData.map(item => item.id));
        const fragment = document.createDocumentFragment();
        let currentNodes = Array.from(this.cardsGrid.children);

        // Remove không cần
        for (let i = currentNodes.length - 1; i >= 0; i--) {
            const node = currentNodes[i];
            const nodeId = node.dataset.id;
            if (!newVisibleIds.has(nodeId)) {
                this.cardsGrid.removeChild(node);
                this.renderedCardIds.delete(nodeId);
            }
        }

        // Append theo thứ tự visibleData để tránh skip
        visibleData.forEach(item => {
            const itemId = item.id;
            let cardElement = this.cardsGrid.querySelector(`[data-id="${itemId}"]`);
            if (!cardElement) {
                cardElement = this.createCardElement(item);
                this.renderedCardIds.add(itemId);
            }
            fragment.appendChild(cardElement);
        });

        this.cardsGrid.appendChild(fragment);
        console.log(`Rendered ${this.cardsGrid.children.length} cards`);
    }

    // ... (giữ nguyên createCardElement và createCardHTML)
}

new VirtualCards();
