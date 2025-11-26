export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const { accessToken, instanceUrl, objectName } = req.body;

        if (!accessToken || !instanceUrl || !objectName) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters'
            });
        }

        // Fetch object metadata including fields
        const response = await fetch(
            `${instanceUrl}/services/data/v57.0/sobjects/${objectName}/describe`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch fields for ${objectName}`);
        }

        const data = await response.json();

        // Extract field information
        const fields = data.fields.map(field => ({
            name: field.name,
            label: field.label,
            type: field.type,
            referenceTo: field.referenceTo || []
        }))
            .sort((a, b) => a.name.localeCompare(b.name));

        res.status(200).json({
            success: true,
            data: {
                objectName: data.name,
                fields: fields
            }
        });

    } catch (error) {
        console.error('Error fetching fields:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch fields'
        });
    }
}
