import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = "force-dynamic";

// POST - Upload image for an item
export async function POST(req: Request) {
    try {
        const supabase = await createClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Parse form data
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const itemId = formData.get('item_id') as string;
        const caption = formData.get('caption') as string || null;

        if (!file || !itemId) {
            return NextResponse.json(
                { error: "File and item_id are required" },
                { status: 400 }
            );
        }

        // Verify user has access to this item's farm
        const { data: itemData, error: itemError } = await supabase
            .from('malroda_items')
            .select('id, farm_id')
            .eq('id', itemId)
            .single();

        if (itemError || !itemData) {
            return NextResponse.json({ error: "Item not found" }, { status: 404 });
        }

        const { data: memberData, error: memberError } = await supabase
            .from('malroda_farm_members')
            .select('farm_id')
            .eq('farm_id', itemData.farm_id)
            .eq('user_id', user.id)
            .single();

        if (memberError || !memberData) {
            return NextResponse.json(
                { error: "You don't have access to this item" },
                { status: 403 }
            );
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${itemId}/${Date.now()}.${fileExt}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('item-images')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error("[Image Upload Error]:", uploadError);
            return NextResponse.json(
                { error: "Failed to upload image: " + uploadError.message },
                { status: 500 }
            );
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('item-images')
            .getPublicUrl(fileName);

        // Get current max display_order
        const { data: maxOrderData } = await supabase
            .from('malroda_item_images')
            .select('display_order')
            .eq('item_id', itemId)
            .order('display_order', { ascending: false })
            .limit(1)
            .single();

        const newOrder = (maxOrderData?.display_order || 0) + 1;

        // Save to database
        const { data: imageRecord, error: dbError } = await supabase
            .from('malroda_item_images')
            .insert({
                item_id: itemId,
                image_url: urlData.publicUrl,
                storage_path: fileName,
                display_order: newOrder,
                caption: caption,
                uploaded_by: user.id
            })
            .select()
            .single();

        if (dbError) {
            console.error("[Image DB Error]:", dbError);
            // Try to delete uploaded file
            await supabase.storage.from('item-images').remove([fileName]);
            return NextResponse.json(
                { error: "Failed to save image record" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            image: imageRecord
        }, { status: 201 });

    } catch (error: any) {
        console.error("[Image API Error]:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// GET - Get images for an item
export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(req.url);
        const itemId = searchParams.get('item_id');
        const itemName = searchParams.get('item_name');

        if (!itemId && !itemName) {
            return NextResponse.json(
                { error: "item_id or item_name is required" },
                { status: 400 }
            );
        }

        let targetItemId = itemId;

        // If item_name is provided, find the item ID first
        if (!targetItemId && itemName) {
            const zone = searchParams.get('zone');
            const grade = searchParams.get('grade');

            let query = supabase
                .from('malroda_items')
                .select('id')
                .eq('item_name', itemName);

            // Add zone filter if provided
            if (zone) {
                query = query.eq('zone', zone);
            }
            // Add grade filter if provided
            if (grade) {
                query = query.eq('grade', grade);
            }

            const { data: itemData, error: itemError } = await query.limit(1).single();

            if (itemError || !itemData) {
                // No item found with this name/zone/grade combination
                return NextResponse.json({ images: [] }, { status: 200 });
            }
            targetItemId = itemData.id;
        }

        const { data: images, error } = await supabase
            .from('malroda_item_images')
            .select('*')
            .eq('item_id', targetItemId)
            .order('display_order', { ascending: true });

        if (error) {
            console.error("[Get Images Error]:", error);
            return NextResponse.json(
                { error: "Failed to fetch images" },
                { status: 500 }
            );
        }

        return NextResponse.json({ images }, { status: 200 });

    } catch (error: any) {
        console.error("[Image API Error]:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// DELETE - Delete an image
export async function DELETE(req: Request) {
    try {
        const supabase = await createClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const imageId = searchParams.get('image_id');

        if (!imageId) {
            return NextResponse.json(
                { error: "image_id is required" },
                { status: 400 }
            );
        }

        // Get image record
        const { data: imageData, error: fetchError } = await supabase
            .from('malroda_item_images')
            .select('*, malroda_items!inner(farm_id)')
            .eq('id', imageId)
            .single();

        if (fetchError || !imageData) {
            return NextResponse.json({ error: "Image not found" }, { status: 404 });
        }

        // Verify user has access
        const { data: memberData } = await supabase
            .from('malroda_farm_members')
            .select('farm_id')
            .eq('farm_id', (imageData as any).malroda_items.farm_id)
            .eq('user_id', user.id)
            .single();

        if (!memberData) {
            return NextResponse.json(
                { error: "You don't have access to delete this image" },
                { status: 403 }
            );
        }

        // Delete from storage
        if (imageData.storage_path) {
            await supabase.storage
                .from('item-images')
                .remove([imageData.storage_path]);
        }

        // Delete from database
        const { error: deleteError } = await supabase
            .from('malroda_item_images')
            .delete()
            .eq('id', imageId);

        if (deleteError) {
            console.error("[Delete Image Error]:", deleteError);
            return NextResponse.json(
                { error: "Failed to delete image" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error: any) {
        console.error("[Image API Error]:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
