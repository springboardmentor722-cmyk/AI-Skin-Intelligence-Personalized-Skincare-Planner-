import { Link } from "react-router-dom";

function DashboardCard({

    title,

    icon,

    description,

    color,

    link

}){

    return(

        <div className="col-lg-3 col-md-6 mb-4">

            <div className={`card action-card bg-${color} text-white h-100`}>

                <div className="card-body text-center">

                    <i

                        className={`bi ${icon}`}

                        style={{fontSize:"55px"}}

                    ></i>

                    <h4 className="mt-3">

                        {title}

                    </h4>

                    <p>

                        {description}

                    </p>

                    <Link

                        to={link}

                        className="btn btn-light"

                    >

                        Open

                    </Link>

                </div>

            </div>

        </div>

    );

}

export default DashboardCard;