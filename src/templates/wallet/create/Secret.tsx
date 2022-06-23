import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getMnemonic } from '../../../ton/utils';

export function SecretPage() {
    const location = useLocation();
    const [wordList, setWordList] = useState([] as string[]);

    const getWordList = async () => {
        const [mnemonic] = await getMnemonic();
        const words = mnemonic.split(' ');
        setWordList(words);
    };

    useEffect(() => {
        getWordList().then();
    }, []);

    const { t } = useTranslation();

    return (
        <main className="page-main">
            <div className="container">
                <div className="row">
                    <div className="col-md-8 col-lg-4 mx-auto text-center">
                        <div className="main-icon"><i className="fa-duotone fa-microchip" /></div>
                        <h2 className="main-title">{t`secret.title`}</h2>
                        <p className="main-desc mb-4">
                            {t`secret.description`}
                        </p>
                        {(wordList.length === 24) && (
                            <div className="row p-0 text-left d-flex justify-content-center">
                                <ul className="col-4">
                                    {wordList.slice(0, 12).map((item, i) => (
                                        <li className="py-2">
                                            <span className="mr-2 color-grey">
                                                {`${i + 1}.`}
                                            </span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                                <ul className="col-4">
                                    {wordList.slice(12, 24).map((item, i) => (
                                        <li className="py-2">
                                            <span className="mr-2 color-grey">
                                                {`${i + 1 + 12}.`}
                                            </span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <div className="main-buttons">
                            <Link
                                to="/create-wallet-secret-check"
                                className="btn btn-primary"
                                state={{ from: location.pathname, data: { words: wordList } }}
                            >
                                {t`button.continue`}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
