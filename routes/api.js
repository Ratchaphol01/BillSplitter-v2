const express = require('express');
const router = express.Router();

router.post('/ocr-slip', async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'ไม่พบรูปภาพ' });
    }

    const formData = new FormData();
    formData.append('base64Image', `data:${mimeType || 'image/jpeg'};base64,${imageBase64}`);
    formData.append('language', 'tha');
    formData.append('OCREngine', '2');
    formData.append('isTable', 'false');

    const ocrRes = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: { apikey: process.env.OCR_SPACE_API_KEY || 'helloworld' },
      body: formData
    });

    const ocrData = await ocrRes.json();

    if (ocrData.IsErroredOnProcessing) {
      return res.status(422).json({ error: 'OCR ไม่สามารถอ่านรูปได้' });
    }

    const text = ocrData.ParsedResults?.[0]?.ParsedText || '';
    const amount = parseAmountFromSlip(text);

    res.json({ amount, text });
  } catch (error) {
    console.error('OCR error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอ่านสลิป' });
  }
});

function parseAmountFromSlip(text) {
  // Try to find amount after Thai keywords first
  const keywordPatterns = [
    /(?:จำนวนเงิน|ยอดโอน|ยอดเงิน|จำนวน|Amount|Total)[^\d]*(\d[\d,]*\.?\d{0,2})/i,
    /(?:THB|฿)\s*(\d[\d,]*\.?\d{0,2})/i,
    /(\d[\d,]*\.\d{2})\s*(?:บาท|THB|฿)/i
  ];

  for (const pattern of keywordPatterns) {
    const match = text.match(pattern);
    if (match) {
      const num = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(num) && num > 0) return num;
    }
  }

  // Fallback: pick the largest decimal number in the text (likely the total)
  const allNumbers = [...text.matchAll(/(\d[\d,]*\.\d{2})/g)]
    .map(m => parseFloat(m[1].replace(/,/g, '')))
    .filter(n => n > 0 && n < 10000000);

  if (allNumbers.length > 0) return Math.max(...allNumbers);

  return null;
}

module.exports = router;