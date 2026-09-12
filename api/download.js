module.exports = async (req, res) => {
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

    try {
        // Gọi đến API Cobalt / Download Service để lấy stream link ổn định
        const response = await fetch('https://co.wuk.sh/api/json', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: url,
                isAudioOnly: format === 'mp3',
                aFormat: 'mp3',
                vQuality: '720'
            })
        });

        const data = await response.json();

        if (data && data.url) {
            // Redirect người dùng đến đường dẫn file tải trực tiếp đã giải mã
            return res.redirect(302, data.url);
        } else {
            throw new Error(data.text || 'Không thể bóc tách liên kết media.');
        }
    } catch (error) {
        console.error('Lỗi Server:', error);
        return res.status(500).json({ error: 'Lỗi khi xử lý video: ' + error.message });
    }
};
