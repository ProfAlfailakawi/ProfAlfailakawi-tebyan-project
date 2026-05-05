import { db } from '../src/lib/firebase';
import { collection, getDocs, writeBatch, doc, deleteDoc } from 'firebase/firestore';

async function fixDataClassification() {
    console.log("Starting data fix...");
    const questionsRef = collection(db, 'qawl_fasl_questions');
    
    // 1. Delete incorrect questions
    const querySnapshot = await getDocs(questionsRef);
    const batch = writeBatch(db);
    let count = 0;
    
    querySnapshot.forEach((document) => {
        const data = document.data();
        if (data.categorySlug === 'general' || !data.categorySlug) {
            batch.delete(doc(db, 'qawl_fasl_questions', document.id));
            count++;
        }
    });

    if (count > 0) {
        await batch.commit();
        console.log(`Deleted ${count} invalid questions.`);
    } else {
        console.log("No invalid questions found.");
    }
    
    console.log("Data fix complete.");
}

fixDataClassification().catch(console.error);
