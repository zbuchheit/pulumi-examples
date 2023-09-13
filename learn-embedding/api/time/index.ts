interface LambdaEvent {
    request: string;
}

export const handler = async (event: LambdaEvent): Promise<any> => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    let message: string;
    switch (event.request) {
        case "timezone":
            message = timezone();
            break;
        case "location":
            message = location() || "Location not found";
            break;
        default:
            message = "Unknown request";
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ message }),
    };
};

export function timezone(): string {
    return new Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function location(): string | undefined {
    return process.env.AWS_REGION;
}
