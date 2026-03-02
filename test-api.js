async function runComprehenveTest() {
    try {
        const userId = '00000000-0000-0000-0000-000000000000';

        // 1. 화훼 시세 테스트
        console.log("\n=== Test 1: 화훼 시세 조회 (장미) ===");
        const res1 = await fetch('http://localhost:3000/api/router', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: '양재동 장미 시세 알려줘.', sessionId: 'test-flower', userId })
        });
        const data1 = await res1.json();
        console.log("API Used:", data1.action_result.api_used);
        console.log("Reply:", data1.reply);

        // 2. 복잡한 재고 조회 (필터링)
        console.log("\n=== Test 2: 복잡한 재고 조회 (50개 이하 품목) ===");
        const res2 = await fetch('http://localhost:3000/api/router', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: '재고가 50개 이하인 것만 골라줘.', sessionId: 'test-query-complex', userId })
        });
        const data2 = await res2.json();
        console.log("SQL:", data2.action_result.sql_used);
        console.log("Reply:", data2.reply);

        // 3. 인벤토리 업데이트 취소 흐름
        console.log("\n=== Test 3: 취소 흐름 테스트 (입고 -> 취소) ===");
        const sessionIdCancel = 'test-cancel-' + Date.now();
        console.log("-> Turn 1: 로즈마리 5kg 추가");
        await fetch('http://localhost:3000/api/router', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: '로즈마리 5kg 추가해줘.', sessionId: sessionIdCancel, userId })
        });
        console.log("-> Turn 2: 아냐 취소할게");
        const res3 = await fetch('http://localhost:3000/api/router', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: '아냐 취소할게.', sessionId: sessionIdCancel, userId })
        });
        const data3 = await res3.json();
        console.log("Intent:", data3.intent);
        console.log("Reply:", data3.reply);

    } catch (e) {
        console.error('Test error:', e);
    }
}

runComprehenveTest();
