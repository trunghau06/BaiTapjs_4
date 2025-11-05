async function deleteLastAndAddRecord(newRecord) {
    try {
        // Chờ cho đến khi load xong hết dữ liệu
        while (loading || allLoadedData.length === 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log(`Tổng số record hiện tại: ${allLoadedData.length}`);

        // Xóa record cuối cùng nếu đủ 100
        if (allLoadedData.length >= 100) {
            const lastRecord = allLoadedData[allLoadedData.length - 1];
            console.log(`Đang xóa record có id: ${lastRecord.id}`);

            // Xóa record trên API trước
            const deleteResponse = await fetch(`${API_URL}/${lastRecord.id}`, { method: "DELETE" });
            
            if (!deleteResponse.ok) {
                console.error("Lỗi khi xóa record:", await deleteResponse.text());
                return;
            }

            // Sau khi xóa API thành công mới xóa khỏi mảng
            allLoadedData.pop();

            // Xóa khỏi DOM
            const lastTableRow = tableBodyElement.querySelector(`tr[data-id="${lastRecord.id}"]`);
            if (lastTableRow) lastTableRow.remove();

            const lastCard = cardViewElement.querySelector(`.card[data-id="${lastRecord.id}"]`);
            if (lastCard) lastCard.remove();

            console.log(`Đã xóa record có id: ${lastRecord.id}`);
        }

        // Thêm record mới
        const response = await fetch(`${API_URL}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newRecord)
        });

        if (!response.ok) {
            console.error("Lỗi khi thêm record:", await response.text());
            return;
        }

        const addedData = await response.json();

        // Thêm lên đầu allLoadedData
        allLoadedData.unshift(addedData);
        
        // Thêm lên đầu DOM
        prependNewItems([addedData]);

        scrollContainer.scrollTop = 0; 
        console.log("Đã thêm record mới lên đầu:", addedData);
    } catch (error) {
        console.error("Lỗi khi thao tác record:", error);
    }
}