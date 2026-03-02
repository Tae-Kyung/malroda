const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bcrangkhejfwskwglxmy.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Using the anon key to test if the Next.js app has access

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFetch() {
    console.log("Fetching from malroda_items directly...");
    const { data: items, error: itemError } = await supabase
        .from('malroda_items')
        .select('*')
        .eq('item_name', '레몬유칼리')
        .eq('zone', '서울');

    console.log("Direct malroda_items:", items);
    console.log("Direct malroda_items error:", itemError);

    console.log("\nFetching from v_malroda_inventory_summary...");
    const { data: viewData, error: viewError } = await supabase
        .from('v_malroda_inventory_summary')
        .select('*')
        .eq('item_name', '레몬유칼리')
        .eq('zone', '서울');

    console.log("View data:", viewData);
    console.log("View error:", viewError);
}

testFetch();
