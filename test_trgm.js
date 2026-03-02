const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bcrangkhejfwskwglxmy.supabase.co';
// Using ANON KEY
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjcmFuZ2toZWpmd3Nrd2dseG15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjkyNzcsImV4cCI6MjA4MzkwNTI3N30.Q0q_TZMLE_EVCL_lbRIIZmNKaIfbR0CwSRegA7iVsyE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testTrgm() {
    console.log("Testing pg_trgm via execute_read_only_sql...");
    const { data, error } = await supabase.rpc('execute_read_only_sql', {
        query: "SELECT item_name, similarity(item_name, '레몬바나나') as sim FROM v_malroda_inventory_summary WHERE similarity(item_name, '레몬바나나') > 0.1 LIMIT 5;"
    });

    console.log("Data:", data);
    console.log("Error:", error);
}

testTrgm();
