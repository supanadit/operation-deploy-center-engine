abstract class UploadTypeAbstract {
    type: String;

    protected constructor(type: String) {
        this.type = type;
    }

}

class UploadType extends UploadTypeAbstract {
    type: String;

    constructor(type: String) {
        super(type);
        this.type = type;
    }

    ftp: UploadType = new UploadType("ftp");
    sftp: UploadType = new UploadType("sftp");
    automation: UploadType = new UploadType("automation");
}