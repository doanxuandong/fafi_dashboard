const admin = require('firebase-admin');
const fs = require('fs');

// Khởi tạo Firebase Admin SDK
const serviceAccount = require('./path-to-your-service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'fafi-hvb'
});

const db = admin.firestore();

async function exportFirestoreData() {
  try {
    console.log('Bắt đầu export dữ liệu Firestore...');
    
    // Lấy danh sách tất cả collections
    const collections = await db.listCollections();
    const exportData = {};
    
    for (const collection of collections) {
      console.log(`Đang export collection: ${collection.id}`);
      const snapshot = await collection.get();
      const docs = [];
      
      snapshot.forEach(doc => {
        docs.push({
          id: doc.id,
          data: doc.data()
        });
      });
      
      exportData[collection.id] = docs;
    }
    
    // Lưu vào file JSON
    fs.writeFileSync('firestore-export.json', JSON.stringify(exportData, null, 2));
    console.log('Export hoàn thành! Dữ liệu đã được lưu vào firestore-export.json');
    
  } catch (error) {
    console.error('Lỗi khi export:', error);
  }
}

exportFirestoreData();
