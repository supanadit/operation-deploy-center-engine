abstract class ProgrammingLanguageAbstract {
    name: String;

    protected constructor(name: String) {
        this.name = name;
    }

}

class ProgrammingLanguage extends ProgrammingLanguageAbstract {
    name: String;

    constructor(name: String) {
        super(name);
        this.name = name;
    }

    node: ProgrammingLanguage = new ProgrammingLanguage("node");
}