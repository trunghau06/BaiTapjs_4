class VirtualCards 
{
    constructor() 
    {
        this.data        = [];  //* chua du lieu card tu API
        this.cardHeight  = 250; //* chieu cao moi card
        this.cardPerRow  = 0;   //* so luong card tren moi hang
        this.visibleRow  = 0    //* so hang thuc te tren man viewport
        this.bufferRow   = 0    //* so hang tai them
        this.startIndex  = 0;
        this.endIndex    = 0;
        this.isLoading   = false;
        this.hasMore     = true;
        this.currentPage = 1;

        this.cardsContainer = document.getElementById('cardsContainer');
        this.cardsSpacer    = document.getElementById('cardsSpacer');
        this.cardsContent   = document.getElementById('cardsContent');
        this.cardsGrid      = document.getElementById('cardsGrid');
        this.loader         = document.getElementById('loader');
        this.loadingMore    = document.getElementById('loadingMore');

        this.init();
    }

    async init() 
    {
        await this.loadData();
        
        this.calculateLayout();
        this.setUpScrollListener();
        this.setupResizeListener();
        this.render();

        this.loader.style.display = 'none';
        this.cardsContainer.style.display = 'block';
    }

    async loadData


    

}