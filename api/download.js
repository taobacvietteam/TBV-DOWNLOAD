const ytdl = require('@distube/ytdl-core');

module.exports = async (req, res) => {
    // Bật CORS cho phép trang web Frontend của bạn kết nối đến
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Xử lý request preflight OPTIONS của trình duyệt
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { url, format } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'Vui lòng cung cấp tham số url' });
    }

    try {
        // Kiểm tra xem URL có hợp lệ không
        if (!ytdl.validateURL(url)) {
            return res.status(400).json({ error: 'URL YouTube không hợp lệ' });
        }

        // Lấy thông tin chi tiết của video
        const info = await ytdl.getInfo(url);
        const title = info.videoDetails.title.replace(/[^\w\s\u00C0-\u1EF9]/gi, '_');

        if (format === 'mp3') {
            // Thiết lập Header ép trình duyệt tải file về máy dạng .mp3
            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(title)}.mp3"`);
            
            // Stream dữ liệu âm thanh về Client
            ytdl(url, { filter: 'audioonly', quality: 'highestaudio' }).pipe(res);
        } else {
            // Thiết lập Header ép trình duyệt tải file về máy dạng .mp4
            res.setHeader('Content-Type', 'video/mp4');
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(title)}.mp4"`);

            // Stream dữ liệu video về Client
            ytdl(url, { quality: 'highestvideo' }).pipe(res);
        }
    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ error: 'Lỗi khi xử lý video: ' + error.message });
    }
};
