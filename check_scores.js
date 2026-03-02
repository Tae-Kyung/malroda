const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bcrangkhejfwskwglxmy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjcmFuZ2toZWpmd3Nrd2dseG15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjkyNzcsImV4cCI6MjA4MzkwNTI3N30.Q0q_TZMLE_EVCL_lbRIIZmNKaIfbR0CwSRegA7iVsyE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkScores() {
    const { data, error } = await supabase.rpc('execute_read_only_sql', {
        query: `SELECT item_name, similarity(item_name, '레몬바나나') as sim FROM (SELECT DISTINCT item_name FROM v_malroda_inventory_summary) sub ORDER BY sim DESC LIMIT 10`
    });

    console.log("Error:", error);
    console.log("Data:");
    console.table(data);
}

checkScores();
