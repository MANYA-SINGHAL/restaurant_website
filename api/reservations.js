export default function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
    
    console.log('Reservation received:', req.body);
    
    const { first_name, last_name, email, party_size, occasion, reservation_date, reservation_time, phone, special_request } = req.body;
    
    // Basic validation
    if (!first_name || !last_name || !email || !party_size || !reservation_date || !reservation_time) {
        return res.status(400).json({
            success: false,
            message: 'Please fill in all required fields.'
        });
    }
    
    // Log the reservation (in production, you'd save to a database)
    console.log('New reservation:', {
        name: `${first_name} ${last_name}`,
        email,
        party_size,
        occasion,
        date: reservation_date,
        time: reservation_time,
        phone,
        special_request
    });
    
    // Send success response
    res.json({
        success: true,
        message: `Thank you ${first_name}! Your reservation for ${party_size} people on ${reservation_date} at ${reservation_time} has been confirmed.`
    });
}