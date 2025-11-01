class VirtualCards {
      constructor() {
        this.data = [];
        this.cardHeight = 250;
        this.cardsPerRow = 0;
        this.visibleRows = 0;
        this.bufferRows = 2;
        this.startIndex = 0;
        this.endIndex = 0;
        this.isLoading = false;
        this.hasMore = true;
        this.currentPage = 1;
        
        this.cardsContainer = document.getElementById('cardsContainer');
        this.cardsSpacer = document.getElementById('cardsSpacer');
        this.cardsContent = document.getElementById('cardsContent');
        this.cardsGrid = document.getElementById('cardsGrid');
        this.loader = document.getElementById('loader');
        this.loadingMore = document.getElementById('loadingMore');
        
        this.init();
      }

      async init() {
        await this.loadData();
        this.calculateLayout();
        this.setupScrollListener();
        this.setupResizeListener();
        this.render();
        
        this.loader.style.display = 'none';
        this.cardsContainer.style.display = 'block';
      }

      async loadData() {
        if (this.isLoading || !this.hasMore) return;
        
        this.isLoading = true;
        if (this.currentPage > 1) {
          this.loadingMore.style.display = 'block';
        }

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
          console.error('Error:', error);
        }

        this.isLoading = false;
        this.loadingMore.style.display = 'none';
      }

      calculateLayout() {
        const containerWidth = this.cardsGrid.offsetWidth;
        const cardWidth = 320;
        const gap = 20;
        this.cardsPerRow = Math.floor((containerWidth + gap) / (cardWidth + gap)) || 1;
        
        const containerHeight = this.cardsContainer.clientHeight;
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
            this.render();
          }, 200);
        });
      }

      checkLoadMore() {
        const scrollTop = this.cardsContainer.scrollTop;
        const scrollHeight = this.cardsContainer.scrollHeight;
        const clientHeight = this.cardsContainer.clientHeight;
        const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
        
        if (scrollPercentage > 0.7 && !this.isLoading && this.hasMore) {
          this.loadData().then(() => {
            this.render();
          });
        }
      }

      render() {
        const scrollTop = this.cardsContainer.scrollTop;
        
        const startRow = Math.floor(scrollTop / this.cardHeight);
        const adjustedStartRow = Math.max(0, startRow - this.bufferRows);
        
        this.startIndex = adjustedStartRow * this.cardsPerRow;
        const endRow = startRow + this.visibleRows + (this.bufferRows * 2);
        this.endIndex = Math.min(this.data.length, endRow * this.cardsPerRow);
        
        const totalRows = Math.ceil(this.data.length / this.cardsPerRow);
        const totalHeight = totalRows * this.cardHeight;
        this.cardsSpacer.style.height = totalHeight + 'px';
        
        const offsetY = adjustedStartRow * this.cardHeight;
        this.cardsContent.style.transform = `translateY(${offsetY}px)`;
        
        const visibleData = this.data.slice(this.startIndex, this.endIndex);
        
        this.cardsGrid.innerHTML = visibleData.map(item => this.createCard(item)).join('');
      }

      createCard(item) {
        const isMale = item.genre && item.genre.includes('man');
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
                ${isMale ? '👨 Nam' : '👩 Nữ'}
              </span>
            </div>
            <div class="card-body">
              <div class="card-item">
                <span class="card-icon">📧</span>
                <span>${item.email || 'N/A'}</span>
              </div>
              <div class="card-item">
                <span class="card-icon">📞</span>
                <span>${item.phone || 'N/A'}</span>
              </div>
              <div class="card-item">
                <span class="card-icon">📍</span>
                <span>${item.city || 'N/A'}, ${item.state || 'N/A'}</span>
              </div>
              <div class="card-item">
                <span class="card-icon">🏠</span>
                <span>${item.street || 'N/A'}</span>
              </div>
            </div>
          </div>
        `;
      }
    }

    new VirtualCards();