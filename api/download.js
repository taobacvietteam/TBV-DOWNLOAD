module.exports = async (req, res) => {
    // Cấu hình CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { url, format } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'Vui lòng cung cấp URL video!' });
    }

    // Danh sách các Endpoint API hỗ trợ tải media chất lượng cao
    const API_ENDPOINTS = [
        'https://api.cobalt.tools',
        'https://cobalt-api.kwiatekmons.com'
    ];

    let downloadUrl = null;
    let lastError = null;

    // Lặp qua các server để tìm link tải thành công
    for (const endpoint of API_ENDPOINTS) {
        try {
            const response = await fetch(`${endpoint}/`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                body: JSON.stringify({
                    url: url,
                    downloadMode: format === 'mp3' ? 'audio' : 'auto',
                    audioFormat: 'mp3',
                    videoQuality: '720'
                })
            });

            if (!response.ok) {
                continue;
            }

            const data = await response.json();

            if (data && (data.url || data.picker)) {
                downloadUrl = data.url || (data.picker && data.picker[0] ? data.picker[0].url : null);
                if (downloadUrl) break;
            }
        } catch (err) {
            lastError = err.message;
        }
    }

    // Trả về kết quả nếu tìm thấy link stream
    if (downloadUrl) {
        return res.redirect(302, downloadUrl);
    }

    // Luồng dự phòng cuối cùng nếu các API Cobalt bận
    try {
        const fallbackRes = await fetch(`https://api.vkrdown.com/api/download?url=${encodeURIComponent(url)}`);
        const fallbackData = await fallbackRes.json();
        
        if (fallbackData && fallbackData.data) {
            const fallbackUrl = format === 'mp3' 
                ? (fallbackData.data.audio || fallbackData.data.url) 
                : fallbackData.data.url;
            
            if (fallbackUrl) {
                return res.redirect(302, fallbackUrl);
            }
        }
    } catch (e) {
        console.error('Lỗi Fallback API:', e);
    }

    return res.status(500).json({ 
        error: 'Không thể xử lý video vào lúc này. Vui lòng thử lại sau!' 
    });
};
